import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import deleteRecords from '@salesforce/apex/GenericMassDeleteController.deleteRecords';

export default class MassDeleteAction extends LightningElement {
    @api recordIdString; // Flow에서 받음 (CSV 형태: "Id1,Id2,Id3")
    
    @track isLoading = false;
    @track isExecuted = false;
    @track result;
    @track errorMessage;

    get recordIds() {
        if (!this.recordIdString) return [];
        return this.recordIdString.split(',').filter(id => id.trim() !== '');
    }

    get recordCount() {
        return this.recordIds.length;
    }

    get isSuccess() {
        return this.result && 
               this.result.successCount > 0 && 
               this.result.failureCount === 0;
    }

    get isPartialSuccess() {
        return this.result && 
               this.result.successCount > 0 && 
               this.result.failureCount > 0;
    }

    get hasErrors() {
        return this.result && 
               this.result.errors && 
               this.result.errors.length > 0;
    }

async handleDelete() {
        if (this.recordCount === 0) {
            this.showToast('경고', '선택된 레코드가 없습니다.', 'warning');
            return;
        }

        this.isLoading = true;
        
        try {
            const data = await deleteRecords({ recordIds: this.recordIds });
            this.result = data;
            
            // Toast 메시지
if (this.isSuccess) {
                this.showToast('성공', `${data.successCount}건 삭제 완료`, 'success');
            } else if (this.isPartialSuccess) {
                this.showToast('부분 성공', 
                    `${data.successCount}건 삭제, ${data.failureCount}건 실패`, 
                    'warning');
            } else {
                this.showToast('오류', '레코드 삭제 실패', 'error');
            }
            
        } catch (error) {
            this.errorMessage = error.body?.message || error.message;
            this.result = { 
                successCount: 0, 
                failureCount: this.recordCount, 
                errors: [this.errorMessage] 
            };
            this.showToast('Error', this.errorMessage, 'error');
            
        } finally {
            this.isLoading = false;
            this.isExecuted = true;
        }
    }

    handleCancel() {
        this.closeFlow();
    }

    handleClose() {
        this.closeFlow();
    }

    closeFlow() {
        // Flow 종료 후 원래 페이지로 돌아가기
        const urlParams = new URLSearchParams(window.location.search);
        const retURL = urlParams.get('retURL') || '/lightning/o/' + this.getObjectName() + '/list';
        window.location.href = retURL;
    }

    getObjectName() {
        // recordIds의 첫 번째 ID prefix로 Object 추론
        if (this.recordIds.length > 0) {
            const prefix = this.recordIds[0].substring(0, 3);
            // 간단한 매핑 (필요시 확장)
            const prefixMap = {
                '006': 'Opportunity',
                '500': 'Case',
                '00Q': 'Lead',
                '001': 'Account',
                '003': 'Contact'
            };
            return prefixMap[prefix] || 'home';
        }
        return 'home';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant,
                mode: variant === 'error' ? 'sticky' : 'dismissable'
            })
        );
    }
}