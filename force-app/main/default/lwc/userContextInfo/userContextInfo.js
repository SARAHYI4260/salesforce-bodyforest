import { LightningElement, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import EMAIL_FIELD from '@salesforce/schema/User.Email';
import NAME_FIELD from '@salesforce/schema/User.FirstName';
import LASTNAME_FIELD from '@salesforce/schema/User.LastName';

export default class UserContextInfo extends LightningElement {
    @api userId = USER_ID;
    
    // 현재 로그인한 유저의 이메일 가져오기
    @wire(getRecord, { recordId: '$userId', fields: [EMAIL_FIELD, NAME_FIELD, LASTNAME_FIELD] })
    user;

    // Flow나 다른 곳에서 쓸 수 있게 값 내보내기 (Getter)
    @api
    get userEmail() {
        return this.user.data ? this.user.data.fields.Email.value : null;
    }
}