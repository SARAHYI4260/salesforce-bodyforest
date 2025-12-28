public with sharing class caseDashboardController {
    // LWC에서 데이터를 읽을 수 있도록 설정 (cacheable=true: 성능 최적화)
    @AuraEnabled(cacheable=true)
    public static List<Case> getHighPriorityCases() {
        return [
            SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate, Description 
            FROM Case 
            ORDER BY CreatedDate DESC 
            LIMIT 12
        ];
    }
}