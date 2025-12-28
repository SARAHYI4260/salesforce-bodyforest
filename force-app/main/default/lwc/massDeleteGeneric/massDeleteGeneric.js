import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import deleteRecords from '@salesforce/apex/GenericMassDeleteController.deleteRecords';

export default class MassDeleteFlow extends LightningElement {
    @api recordIds; // Flow에서 자동으로 받음
    
    isDeleting = false;
    hasDeleted = false;
    deleteResult = null;
    
    get recordCount() {
        return this.recordIds?.length || 0;
    }
    
    get showSuccess() {
        return this.hasDeleted && 
               this.deleteResult?.successCount > 0 && 
               this.deleteResult?.failureCount === 0;
    }
    
    get showPartialSuccess() {
        return this.hasDeleted && 
               this.deleteResult?.successCount > 0 && 
               this.deleteResult?.failureCount > 0;
    }
    
    get showError() {
        return this.hasDeleted && 
               this.deleteResult?.successCount === 0;
    }
    
    get successMessage() {
        return `${this.deleteResult?.successCount} record(s) deleted successfully`;
    }
    
    get partialMessage() {
        return `${this.deleteResult?.successCount} deleted, ${this.deleteResult?.failureCount} failed`;
    }
    
    get errorMessages() {
        return this.deleteResult?.errors?.join('\n') || 'Failed to delete records';
    }

    connectedCallback() {
        // 컴포넌트 로드 시 자동 실행
        this.handleDelete();
    }

    async handleDelete() {
        if (!this.recordIds?.length) {
            this.showToast('Error', 'No records selected', 'error');
            return;
        }

        this.isDeleting = true;

        try {
            const result = await deleteRecords({ 
                recordIds: this.recordIds 
            });
            
            this.deleteResult = result;
            this.hasDeleted = true;

            // Toast 메시지
            if (result.successCount > 0 && result.failureCount === 0) {
                this.showToast('Success', this.successMessage, 'success');
            } else if (result.successCount > 0) {
                this.showToast('Partial Success', this.partialMessage, 'warning');
            } else {
                this.showToast('Error', 'Failed to delete records', 'error');
            }

        } catch (error) {
            this.showToast(
                'Error',
                error.body?.message || 'An unexpected error occurred',
                'error'
            );
        } finally {
            this.isDeleting = false;
        }
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