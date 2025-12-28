/**
 * @description       : Survey Response 완료 시 비동기(Queueable)로 Case 업데이트
 * @author            : User
 * @last modified on  : 12-17-2025
**/
public without sharing class SurveyResponseHandler implements Queueable {

    private Set<Id> responseIds;

    // 생성자: 트리거에서 ID를 받아옴
    public SurveyResponseHandler(Set<Id> responseIds) {
        this.responseIds = responseIds;
    }

    // ============================================================================
    // Case 필드 API Name이 아니라, '설문 문항'의 API Name입니다.
    // ============================================================================
private static final String QUESTION_DEV_NAME_CSAT = 'q_22453352_d28d_48e8_995e_dcd2a60dfb09';      
private static final String QUESTION_DEV_NAME_COMMENT = 'q_ee5440cd_b420_4e66_b3b5_d54387fcf7dd';

    // 1. 트리거에서 호출하는 진입점
    public static void processCompletedResponses(List<SurveyResponse> newResponses, Map<Id, SurveyResponse> oldMap) {
        Set<Id> completedResponseIds = new Set<Id>();

        for (SurveyResponse res : newResponses) {
            SurveyResponse oldRes = (oldMap != null) ? oldMap.get(res.Id) : null;
            
            // 상태가 Completed로 변했거나, 처음부터 Completed인 경우
            if (res.Status == 'Completed' && (oldMap == null || oldRes.Status != 'Completed')) {
                completedResponseIds.add(res.Id);
            }
        }

        // 대상이 있으면 비동기 작업(Queueable) 등록 -> 답변이 저장될 시간을 벎
        if (!completedResponseIds.isEmpty()) {
            System.enqueueJob(new SurveyResponseHandler(completedResponseIds));
        }
    }

    // 2. 비동기로 실행되는 실제 로직
    public void execute(QueueableContext context) {
        // 비동기 시점에는 답변 데이터가 확실히 존재함
        List<SurveyQuestionResponse> questionResponses = [
            SELECT ResponseId, Question.DeveloperName, NumberValue, ResponseShortText, InvitationId
            FROM SurveyQuestionResponse
            WHERE ResponseId IN :responseIds
        ];

        if (questionResponses.isEmpty()) return;

        // Invitation ID 수집
        Set<Id> invitationIds = new Set<Id>();
        for (SurveyQuestionResponse qr : questionResponses) {
            // SurveyQuestionResponse 객체에 직접 InvitationId 필드가 있는 경우 (최신 버전)
            // 만약 없다면 부모 SurveyResponse를 통해 가져와야 함. 
            // 여기서는 안전하게 쿼리된 결과의 ResponseId를 통해 부모를 다시 조회하는 방식 권장하지만,
            // 코드를 간결하게 하기 위해 위 쿼리에 InvitationId가 포함된다고 가정하거나
            // 아래처럼 부모를 통해 매핑합니다.
            if (qr.ResponseId != null) {
                 // 로직 단순화를 위해 아래 매핑 로직에서 처리
            }
        }
        
        // SurveyResponse를 통해 InvitationId 다시 조회 (확실한 방법)
        Map<Id, Id> responseToInvitationMap = new Map<Id, Id>();
        for(SurveyResponse r : [SELECT Id, InvitationId FROM SurveyResponse WHERE Id IN :responseIds]){
            if(r.InvitationId != null) responseToInvitationMap.put(r.Id, r.InvitationId);
        }
        
        invitationIds.addAll(responseToInvitationMap.values());
        if(invitationIds.isEmpty()) return;

        // Invitation과 연결된 Case ID 찾기
        Map<Id, Id> invitationToCaseIdMap = new Map<Id, Id>();
        List<SurveySubject> subjects = [
            SELECT ParentId, SubjectId FROM SurveySubject WHERE ParentId IN :invitationIds
        ];

        for (SurveySubject sub : subjects) {
            String subjectIdStr = (String)sub.SubjectId;
            if (String.isNotBlank(subjectIdStr) && subjectIdStr.startsWith('500')) {
                invitationToCaseIdMap.put(sub.ParentId, sub.SubjectId);
            }
        }
        
        if (invitationToCaseIdMap.isEmpty()) return;

        // Case 업데이트 준비
        Map<Id, Case> casesToUpdate = new Map<Id, Case>();

        for (SurveyQuestionResponse qr : questionResponses) {
            Id invitationId = responseToInvitationMap.get(qr.ResponseId);
            if (invitationId == null || !invitationToCaseIdMap.containsKey(invitationId)) continue;

            Id caseId = invitationToCaseIdMap.get(invitationId);

            if (!casesToUpdate.containsKey(caseId)) {
                casesToUpdate.put(caseId, new Case(Id = caseId));
            }
            Case c = casesToUpdate.get(caseId);

            // 질문 매핑 (여기가 중요!)
            if (qr.Question.DeveloperName == QUESTION_DEV_NAME_CSAT) {
                if (qr.NumberValue != null) {
                    // Picklist API Name과 매칭 (예: "5")
                    c.RepairSatisfaction__c = String.valueOf(Integer.valueOf(qr.NumberValue));
                }
            } else if (qr.Question.DeveloperName == QUESTION_DEV_NAME_COMMENT) {
                c.Survey_Comment__c = qr.ResponseShortText;
            }
        }

        if (!casesToUpdate.isEmpty()) {
            try {
                update casesToUpdate.values();
            } catch (Exception e) {
                System.debug('Error updating cases: ' + e.getMessage());
            }
        }
    }
}