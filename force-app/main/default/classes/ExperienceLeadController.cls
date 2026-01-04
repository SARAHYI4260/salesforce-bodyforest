public with sharing class ExperienceLeadController {

    // ===== DTO =====
    public class LeadRequest {
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
        @AuraEnabled public String mobilePhone;

        // ✅ 추가: 관심제품(픽리스트), 방문경로(LeadSource 픽리스트)
        @AuraEnabled public String productInterest; // ProductInterest__c
        @AuraEnabled public String leadSource;      // LeadSource
    }

    // ✅ LWC에서는 이 메서드만 호출
    @AuraEnabled
    public static Id createLeadFromJson(String payloadJson) {
        if (String.isBlank(payloadJson)) {
            throw new AuraHandledException('저장 실패: 요청 데이터가 비어있습니다.');
        }

        LeadRequest req;
        try {
            req = (LeadRequest) JSON.deserialize(payloadJson, LeadRequest.class);
        } catch (Exception e) {
            throw new AuraHandledException('저장 실패: 요청 데이터 파싱 실패 - ' + e.getMessage());
        }

        // ===== 필수값 체크(프론트에서 누락돼도 서버에서 한 번 더 방어) =====
        // LastName은 Salesforce 필수라서, 정말 비어있으면 기본값 처리(원하면 여기서 "필수"로 막아도 됨)
        String safeLastName = String.isBlank(req.lastName) ? 'Guest' : req.lastName;

        // ===== 권한 체크 (Guest User 포함) =====
        if (!Schema.sObjectType.Lead.isCreateable()) {
            throw new AuraHandledException('저장 실패: Lead 생성 권한(Create)이 없습니다.');
        }

        // ===== Lead 생성 =====
        Lead l = new Lead();
        l.LastName    = safeLastName;
        l.FirstName   = req.firstName;
        l.Email       = req.email;
        l.Phone       = req.phone;
        l.MobilePhone = req.mobilePhone;

        // Company는 Lead 필수인 org가 많아서 안전값 세팅
        l.Company = null;

        // ✅ 유입으로 저장 (너희 org에 실제 존재하는 Lead Status 값이어야 함)
        // (네가 올린 픽리스트에서 "유입" 값이 존재함)
        l.Status = '유입';

        // ✅ 방문경로(LeadSource) / 관심제품(ProductInterest__c)
        if (!String.isBlank(req.leadSource)) {
            l.LeadSource = req.leadSource;
        }
        if (!String.isBlank(req.productInterest)) {
            l.ProductInterest__c = req.productInterest;
        }

        // ===== FLS 방어 (Guest User에서 특히 중요) =====
        SObjectAccessDecision sd =
            Security.stripInaccessible(AccessType.CREATABLE, new List<SObject>{ l });

        Lead safeLead = (Lead) sd.getRecords()[0];

        // ===== 실제 저장 결과를 “확실하게” 확인 (중요) =====
        Database.SaveResult sr = Database.insert(safeLead, false);

        if (!sr.isSuccess()) {
            // 에러 메시지 모아서 프론트로 던짐
            List<String> msgs = new List<String>();
            for (Database.Error err : sr.getErrors()) {
                msgs.add(err.getStatusCode() + ': ' + err.getMessage());
            }
            throw new AuraHandledException('저장 실패: ' + String.join(msgs, ' / '));
        }

        // ✅ 여기까지 왔으면 100% 저장 성공
        return sr.getId();
    }
}
