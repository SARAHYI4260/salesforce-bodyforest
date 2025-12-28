import { LightningElement, api } from 'lwc';

export default class CustomTabbedDetail extends LightningElement {
    // 현재 레코드 페이지의 ID를 자동으로 받아옵니다.
    @api recordId;
    // 현재 객체의 API 이름 (예: Opportunity)을 받아옵니다.
    @api objectApiName;
}