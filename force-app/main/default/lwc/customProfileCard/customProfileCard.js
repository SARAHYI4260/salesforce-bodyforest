import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

import CASE_NUMBER from '@salesforce/schema/Case.CaseNumber';
import CASE_STATUS from '@salesforce/schema/Case.Status';
import CASE_PRIORITY from '@salesforce/schema/Case.Priority';

export default class CustomProfileCard extends LightningElement {
    @api recordId;
    imageUrl = 'https://b6s54eznn8xq.merlincdn.net/Uploads/People/6899241d-30e4-4ab9-bdc1-a8fb69df7f13.jpg';

    @wire(getRecord, { 
        recordId: '$recordId', 
        fields: [
            CASE_NUMBER, CASE_STATUS, CASE_PRIORITY,
            'Case.Account.Name', 
            'Case.Account.Customer_Level__c', 
            'Case.Account.Region__c', 
            'Case.Account.Phone', 
            'Case.Account.Email'
        ] 
    })
    caseRecord;

    get accountName() { return getFieldValue(this.caseRecord.data, 'Case.Account.Name') || '고객명 미지정'; }
    get caseNumber() { return getFieldValue(this.caseRecord.data, CASE_NUMBER); }
    get status() { return getFieldValue(this.caseRecord.data, CASE_STATUS); }
    get priority() { return getFieldValue(this.caseRecord.data, CASE_PRIORITY); }
    get customerLevel() { return getFieldValue(this.caseRecord.data, 'Case.Account.Customer_Level__c') || '-'; }
    get region() { return getFieldValue(this.caseRecord.data, 'Case.Account.Region__c') || '-'; }
    get phone() { return getFieldValue(this.caseRecord.data, 'Case.Account.Phone') || '-'; }
    get email() { return getFieldValue(this.caseRecord.data, 'Case.Account.Email') || '-'; }
}