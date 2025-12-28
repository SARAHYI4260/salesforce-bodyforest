trigger SurveyResponseTrigger on SurveyResponse (after insert, after update) {
    // 트리거는 로직을 최소화하고 핸들러 클래스에 위임하는 것이 Best Practice입니다.
    if (Trigger.isAfter) {
        SurveyResponseHandler.processCompletedResponses(Trigger.new, Trigger.oldMap);
    }
}