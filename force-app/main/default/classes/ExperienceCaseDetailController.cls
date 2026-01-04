public without sharing class ExperienceCaseDetailController {

    public class CaseDetailResponse {
        @AuraEnabled public Case caseRecord;
        @AuraEnabled public List<WorkOrder> workOrders;
    }

    @AuraEnabled(cacheable=true)
    public static CaseDetailResponse getCaseDetail(String caseId) {
        if (String.isBlank(caseId)) {
            throw new AuraHandledException('caseId 파라미터가 없습니다. 예: /s/case-detail?caseId=500...');
        }

        // Case 상세 (너가 공유했던 Case 필드 목록 중심)
        Case c = [
            SELECT Id, CaseNumber, Subject, Description, Status, Priority,
                   Origin, Reason, Type,
                   CreatedDate, ClosedDate,
                   OwnerId,
                   AccountId, ContactId,
                   Contact.Name, Contact.Email, Contact.Phone, Contact.MobilePhone,

                   // 아래는 네 목록에 있던 필드들(Org에 없으면 배포/실행 에러 가능)
                   AI_Summary__c,
                   Comments,
                   PotentialLiability__c,
                   Product__c, ProductId,
                   Work_Order__c,
                   Contract__c,
                   Messaging_Session_Id__c,
                   CaseReason__c,
                   Onsite_Visit_Needed__c,
                   PreferreDate__c,
                   Channel__c,
                   Chatbot_Conversation_Summary__c,
                   Handoff_Requested__c,
                   EngineeringReqNumber__c,
                   RepairSatisfaction__c,
                   Survey_Comment__c
            FROM Case
            WHERE Id = :caseId
            LIMIT 1
        ];

        // WorkOrder: (1) CaseId로 연결된 것들
        List<WorkOrder> byCase = [
            SELECT Id, WorkOrderNumber, Subject, Status, Priority,
                   StartDate, EndDate, CreatedDate,
                   Description,
                   Summary__c,
                   IsCompleted__c,
                   Work_Plan_Auto_Generated__c,
                   ServiceTerritoryId
            FROM WorkOrder
            WHERE CaseId = :caseId
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];

        // WorkOrder: (2) Case의 lookup(Work_Order__c)로 연결된 단건도 포함
        // - 중복 제거 위해 Set 사용
        Set<Id> woIds = new Set<Id>();
        for (WorkOrder w : byCase) woIds.add(w.Id);
        if (c.Work_Order__c != null) woIds.add(c.Work_Order__c);

        List<WorkOrder> finalWos = new List<WorkOrder>();
        if (!woIds.isEmpty()) {
            finalWos = [
                SELECT Id, WorkOrderNumber, Subject, Status, Priority,
                       StartDate, EndDate, CreatedDate,
                       Description,
                       Summary__c,
                       IsCompleted__c,
                       Work_Plan_Auto_Generated__c,
                       ServiceTerritoryId
                FROM WorkOrder
                WHERE Id IN :woIds
                ORDER BY CreatedDate DESC
            ];
        }

        CaseDetailResponse res = new CaseDetailResponse();
        res.caseRecord = c;
        res.workOrders = finalWos;
        return res;
    }
}
