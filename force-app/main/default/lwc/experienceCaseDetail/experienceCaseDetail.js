import { LightningElement, track } from 'lwc';
import getCaseDetail from '@salesforce/apex/ExperienceCaseDetailController.getCaseDetail';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';

export default class ExperienceCaseDetail extends NavigationMixin(LightningElement) {

    @track caseId;
    @track emailParam;

    @track data = null;
    @track errorMessage = null;
    @track isLoading = false;

    // Work Order 링크 컬럼
    woColumns = [
        {
            label: 'Work Order #',
            fieldName: 'workOrderLink',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'WorkOrderNumber' },
                target: '_self'
            }
        },
        { label: 'Subject', fieldName: 'Subject' },
        { label: 'Status', fieldName: 'Status' }
    ];

    connectedCallback() {
        const params = new URLSearchParams(window.location.search);
        this.caseId = params.get('caseId');
        this.emailParam = params.get('email');

        if (!this.caseId) {
            this.errorMessage = 'caseId 파라미터가 없습니다.';
            return;
        }

        this.fetchDetail();
    }

    async fetchDetail() {
        this.isLoading = true;
        this.errorMessage = null;
        this.data = null;

        try {
            const res = await getCaseDetail({ caseId: this.caseId });

            // ✅ Work Order 링크 가공
            const mappedWos = (res?.workOrders || []).map((w) => ({
                ...w,
                workOrderLink: `/s/workorder-detail?workOrderId=${w.Id}&email=${encodeURIComponent(this.emailParam || '')}`
            }));

            this.data = {
                ...res,
                workOrders: mappedWos
            };
        } catch (e) {
            const msg = e?.body?.message || e?.message || JSON.stringify(e);
            this.errorMessage = `Case 상세 조회 실패: ${msg}`;
        } finally {
            this.isLoading = false;
        }
    }

    // 🔙 Back to MyPage (Work Order Detail과 동일한 방식)
    handleBack() {
        const url = this.emailParam
            ? `${basePath}/mypage?email=${encodeURIComponent(this.emailParam)}`
            : `${basePath}/mypage`;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url }
        });
    }
}
