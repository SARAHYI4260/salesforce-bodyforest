public with sharing class ExperienceLeadController {

    // ===== DTO =====
    public class LeadRequest {
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String company;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
        @AuraEnabled public String mobilePhone;

        @AuraEnabled public String addressDetail;
        @AuraEnabled public Decimal budget;
        @AuraEnabled public Decimal monthlyFee;
        @AuraEnabled public Date desiredVisitDate;

        @AuraEnabled public String requiredFeatures;
        @AuraEnabled public String consultingSummary;
    }

    // ✅ LWC에서는 이 메서드만 호출
    @AuraEnabled
    public static Id createLeadFromJson(String payloadJson) {
        if (String.isBlank(payloadJson)) {
            throw new AuraHandledException('요청 데이터가 비어있습니다.');
        }

        LeadRequest req;
        try {
            req = (LeadRequest)JSON.deserialize(payloadJson, LeadRequest.class);
        } catch (Exception e) {
            throw new AuraHandledException('요청 데이터 파싱 실패: ' + e.getMessage());
        }

        // ===== Lead 생성 =====
        Lead l = new Lead();

        // LastName은 Salesforce 필수 → 값이 없으면 Guest
        l.LastName = String.isBlank(req.lastName) ? 'Guest' : req.lastName;

        l.FirstName = req.firstName;
        l.Company   = String.isBlank(req.company) ? 'Individual' : req.company;

        l.Email       = req.email;
        l.Phone       = req.phone;
        l.MobilePhone = req.mobilePhone;

        // ⚠️ 반드시 org에 존재하는 Lead Status 값
        l.Status = '유입';

        // ===== 커스텀 필드 =====
        l.Address__c             = req.addressDetail;
        l.Budget__c              = req.budget;
        l.Monthly_Fee__c         = req.monthlyFee;
        l.Desired_Visit_Date__c  = req.desiredVisitDate;
        l.RequiredFeatures__c    = req.requiredFeatures;
        l.Consulting_Summary__c  = req.consultingSummary;

        // ===== 권한 체크 =====
        if (!Schema.sObjectType.Lead.isCreateable()) {
            throw new AuraHandledException('Lead 생성 권한이 없습니다.');
        }

        // ===== FLS 방어 (Guest User 필수) =====
        SObjectAccessDecision sd =
            Security.stripInaccessible(AccessType.CREATABLE, new List<SObject>{ l });

        insert sd.getRecords();

        return ((Lead)sd.getRecords()[0]).Id;
    }
}