public without sharing class ExperienceMyPageController {

    public class MyPageResponse {
        @AuraEnabled public Account account;
        @AuraEnabled public List<Case> cases;
        @AuraEnabled public List<WorkOrder> workOrders;
        @AuraEnabled public String matchedBy;
    }

    @AuraEnabled(cacheable=true)
    public static MyPageResponse getMyPageData(String email) {
        if (String.isBlank(email) || !email.contains('@')) {
            throw new AuraHandledException('email 파라미터가 없습니다. 예: /mypage?email=demo@example.com');
        }

        String e = email.trim().toLowerCase();

        Account matchedAccount;
        String matchedBy;

        // 1) Account에서 먼저 매칭 (PersonEmail, Email__c)
        List<Account> accs = [
            SELECT Id, Name, AccountNumber,
                   Phone, IsPersonAccount,
                   PersonEmail, PersonMobilePhone,
                   Email__c,
                   CustomerLevel__c, Rental_Health_Score__c, Brand_Loyalty_Score__c,
                   Address__c
            FROM Account
            WHERE (IsPersonAccount = true AND (PersonEmail = :e OR Email__c = :e))
               OR (IsPersonAccount = false AND Email__c = :e)
            LIMIT 1
        ];

        if (!accs.isEmpty()) {
            matchedAccount = accs[0];
            matchedBy = matchedAccount.IsPersonAccount ? 'Account.PersonEmail/Email__c' : 'Account.Email__c';
        } else {
            // 2) Contact.Email → Account 역추적
            List<Contact> cons = [
                SELECT Id, AccountId, Email
                FROM Contact
                WHERE Email = :e
                LIMIT 1
            ];
            if (!cons.isEmpty() && cons[0].AccountId != null) {
                matchedBy = 'Contact.Email -> Account';
                matchedAccount = [
                    SELECT Id, Name, AccountNumber,
                           Phone, IsPersonAccount,
                           PersonEmail, PersonMobilePhone,
                           Email__c,
                           CustomerLevel__c, Rental_Health_Score__c, Brand_Loyalty_Score__c,
                           Address__c
                    FROM Account
                    WHERE Id = :cons[0].AccountId
                    LIMIT 1
                ];
            }
        }

        if (matchedAccount == null) {
            throw new AuraHandledException('해당 이메일로 매칭되는 Account/Contact를 찾지 못했습니다: ' + email);
        }

        List<Case> caseList = [
            SELECT Id, CaseNumber, Subject, Status, Priority, Origin, Reason, Type,
                   CreatedDate, ClosedDate,
                   ContactId,
                   Contact.Name, Contact.Email, Contact.Phone, Contact.MobilePhone,
                   ContactEmail, ContactPhone, ContactMobile,
                   Product__c, Work_Order__c,
                   CaseReason__c, Onsite_Visit_Needed__c, PreferreDate__c,
                   AI_Summary__c
            FROM Case
            WHERE AccountId = :matchedAccount.Id
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];

        List<WorkOrder> woList = [
            SELECT Id, WorkOrderNumber, Subject, Status, Priority,
                   StartDate, EndDate,
                   Summary__c, IsCompleted__c, Work_Plan_Auto_Generated__c
            FROM WorkOrder
            WHERE AccountId = :matchedAccount.Id
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];

        MyPageResponse res = new MyPageResponse();
        res.account = matchedAccount;
        res.cases = caseList;
        res.workOrders = woList;
        res.matchedBy = matchedBy;
        return res;
    }
}
