public with sharing class BF_UserContextController {
    @AuraEnabled(cacheable=true)
    public static String getMyContactId() {
        User u = [
            SELECT ContactId
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        return (String)u.ContactId;
    }
}