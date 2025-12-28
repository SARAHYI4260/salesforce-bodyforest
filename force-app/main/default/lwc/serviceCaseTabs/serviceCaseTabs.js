import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';

// Case 표준 필드
import CASE_NUMBER from '@salesforce/schema/Case.CaseNumber';
import CASE_STATUS from '@salesforce/schema/Case.Status';
import CASE_PRIORITY from '@salesforce/schema/Case.Priority';

export default class CustomProfileCard extends LightningElement {
    @api recordId;
    imageUrl = 'https://b6s54eznn8xq.merlincdn.net/Uploads/People/6899241d-30e4-4ab9-bdc1-a8fb69df7f13.jpg';

    // 필드 API 명칭 기반 리스트
    fields = [
        CASE_NUMBER, 
        CASE_STATUS, 
        CASE_PRIORITY,
        'Case.Account.Name',
        'Case.Account.CustomerLevel__c',
        'Case.Account.ServiceTerritory__r.Name', // 지역 이름
        'Case.Account.Phone',
        'Case.Account.PersonEmail' // 제공하신 리스트의 Email API명
    ];

    @wire(getRecord, { recordId: '$recordId', fields: '$fields' })
    caseRecord;

    // 데이터 추출 Getter
    get accountName() { return getFieldValue(this.caseRecord.data, 'Case.Account.Name'); }
    get customerLevel() { return getFieldValue(this.caseRecord.data, 'Case.Account.CustomerLevel__c'); }
    get region() { return getFieldValue(this.caseRecord.data, 'Case.Account.ServiceTerritory__r.Name'); }
    get phone() { return getFieldValue(this.caseRecord.data, 'Case.Account.Phone'); }
    get email() { return getFieldValue(this.caseRecord.data, 'Case.Account.PersonEmail'); }
    
    get caseNumber() { return getFieldValue(this.caseRecord.data, CASE_NUMBER); }
    get status() { return getFieldValue(this.caseRecord.data, CASE_STATUS); }
    get priority() { return getFieldValue(this.caseRecord.data, CASE_PRIORITY); }
}