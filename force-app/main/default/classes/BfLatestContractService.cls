public with sharing class BfLatestContractService {

    // LWC로 넘길 DTO(Wrapper)
    public class LatestContractInfo {
        @AuraEnabled public Id     contractId;
        @AuraEnabled public String name;
        @AuraEnabled public String status;
        @AuraEnabled public Date   startDate;
        @AuraEnabled public Date   endDate;
        @AuraEnabled public Decimal remainingDays;
        @AuraEnabled public Decimal monthlyFee;
        @AuraEnabled public Decimal totalAmount;
        @AuraEnabled public String  contractNumber;
        @AuraEnabled public String  stage;
        @AuraEnabled public Integer paidMonths;   // 현재까지 납부 회차
        @AuraEnabled public Integer totalMonths;  // 총 계약 회차 (ContractTerm)
    }

    @AuraEnabled(cacheable=true)
    public static LatestContractInfo getLatestContractForAccount(Id accountId) {
        if (accountId == null) {
            return null;
        }

        // 해당 Account의 "활성" 계약 중 시작일이 가장 최근인 1건
        List<Contract> contracts = [
            SELECT Id,
                   Name,
                   Status,
                   StartDate,
                   EndDate,
                   ContractRemaining__c,
                   Monthly_Fee__c,
                   Quote_Total__c,
                   ContractNumber,
                   Stage__c,
                   ContractTerm
            FROM Contract
            WHERE AccountId = :accountId
            AND Status = 'Activated'      // 필요에 따라 조건 조정
            ORDER BY StartDate DESC
            LIMIT 1
        ];

        if (contracts.isEmpty()) {
            return null;
        }

        Contract c = contracts[0];

        LatestContractInfo info = new LatestContractInfo();
        info.contractId     = c.Id;
        info.name           = c.Name;
        info.status         = String.valueOf(c.Status);
        info.startDate      = c.StartDate;
        info.endDate        = c.EndDate;
        info.remainingDays  = c.ContractRemaining__c;
        info.monthlyFee     = c.Monthly_Fee__c;
        info.totalAmount    = c.Quote_Total__c;
        info.contractNumber = c.ContractNumber;
        info.stage          = c.Stage__c;
        info.totalMonths    = (c.ContractTerm != null)
                              ? Integer.valueOf(c.ContractTerm)
                              : 0;

        // ===== 납부 회차 계산 (StartDate ~ 오늘) =====
        if (c.StartDate != null && info.totalMonths > 0) {
            Date today = Date.today();

            Integer monthsDiff = (today.year() - c.StartDate.year()) * 12
                               + (today.month() - c.StartDate.month());

            // 같은 달 안에서는 시작일 기준으로 +1 처리
            if (today.day() >= c.StartDate.day()) {
                monthsDiff += 1;
            }

            if (monthsDiff < 0) {
                monthsDiff = 0;
            }
            if (monthsDiff > info.totalMonths) {
                monthsDiff = info.totalMonths;
            }

            info.paidMonths = monthsDiff;
        } else {
            info.paidMonths = 0;
        }

        return info;
    }
}