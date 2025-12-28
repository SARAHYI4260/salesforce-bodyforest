import { LightningElement, api, wire } from 'lwc';
import getLatestContractForAccount from '@salesforce/apex/BfLatestContractService.getLatestContractForAccount';

export default class BfContractTiles extends LightningElement {
    @api recordId; // Account Id

    contractInfo;
    error;

    @wire(getLatestContractForAccount, { accountId: '$recordId' })
    wiredContract({ data, error }) {
        if (data) {
            this.contractInfo = data;
            this.error = undefined;
            console.log('bfContractTiles latest contract info => ', data);
        } else if (error) {
            this.error = error;
            this.contractInfo = undefined;
            console.error('bfContractTiles apex error => ', JSON.stringify(error));
        }
    }

    get isLoading() {
        return this.contractInfo === undefined && !this.error;
    }

    get hasData() {
        return this.contractInfo != null;
    }

    // 계약 잔여일
    get remainingDays() {
        return this.contractInfo && this.contractInfo.remainingDays != null
            ? this.contractInfo.remainingDays
            : 0;
    }

    // 월 렌탈료
    get monthlyFee() {
        return this.contractInfo && this.contractInfo.monthlyFee != null
            ? this.contractInfo.monthlyFee
            : 0;
    }

    get formattedMonthlyFee() {
        const fee = this.monthlyFee;
        return fee.toLocaleString('ko-KR');
    }

    // 납부 회차
    get paidCount() {
        return this.contractInfo && this.contractInfo.paidMonths != null
            ? this.contractInfo.paidMonths
            : 0;
    }

    get totalCount() {
        return this.contractInfo && this.contractInfo.totalMonths != null
            ? this.contractInfo.totalMonths
            : 0;
    }
}