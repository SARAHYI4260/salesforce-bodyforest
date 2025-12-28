public with sharing class GenericMassDeleteController {
    
    public class DeleteResult {
        @AuraEnabled public Integer successCount;
        @AuraEnabled public Integer failureCount;
        @AuraEnabled public List<String> errors;
        
        public DeleteResult() {
            this.successCount = 0;
            this.failureCount = 0;
            this.errors = new List<String>();
        }
    }
    
    @AuraEnabled
    public static DeleteResult deleteRecords(List<Id> recordIds) {
        DeleteResult result = new DeleteResult();
        
        if (recordIds == null || recordIds.isEmpty()) {
            throw new AuraHandledException('No records selected');
        }
        
        try {
            // 1. Object 타입 확인
            Schema.SObjectType sObjectType = recordIds[0].getSObjectType();
            Schema.DescribeSObjectResult describe = sObjectType.getDescribe();
            
            // 2. 삭제 권한 체크
            if (!describe.isDeletable()) {
                throw new AuraHandledException(
                    'You do not have permission to delete ' + describe.getLabel() + ' records'
                );
            }
            
            // 3. 레코드 조회 (공유 규칙 적용)
            String objectName = describe.getName();
            String soql = 'SELECT Id FROM ' + String.escapeSingleQuotes(objectName) + 
                         ' WHERE Id IN :recordIds';
            List<SObject> records = Database.query(soql);
            
            // 4. 부분 삭제 실행 (allOrNone = false)
            Database.DeleteResult[] deleteResults = Database.delete(records, false);
            
            // 5. 결과 집계
            for (Integer i = 0; i < deleteResults.size(); i++) {
                if (deleteResults[i].isSuccess()) {
                    result.successCount++;
                } else {
                    result.failureCount++;
                    String recordId = records[i].Id;
                    String errorMsg = recordId + ': ';
                    
                    for (Database.Error err : deleteResults[i].getErrors()) {
                        errorMsg += err.getMessage() + '; ';
                    }
                    
                    result.errors.add(errorMsg);
                }
            }
            
            return result;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
}