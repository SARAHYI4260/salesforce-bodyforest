import { LightningElement, track } from 'lwc';
import getWorkOrderDetail from '@salesforce/apex/ExperienceWorkOrderDetailController.getWorkOrderDetail';
import { NavigationMixin } from 'lightning/navigation';
import basePath from '@salesforce/community/basePath';

export default class ExperienceWorkOrderDetail extends NavigationMixin(LightningElement) {

    @track workOrderId;
    @track emailParam;

    @track data = null;
    @track errorMessage = null;
    @track isLoading = false;

    // ✅ Work Steps: step order, name, status
    workStepColumns = [
        { label: 'Step Order', fieldName: 'ExecutionOrder', type: 'number' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Status', fieldName: 'Status' }
    ];

    // ✅ Work Plans: parent record(표시용), name, description
    workPlanColumns = [
        { label: 'Parent Record', fieldName: 'parentRecordDisplay' },
        { label: 'Name', fieldName: 'Name' },
        { label: 'Description', fieldName: 'Description' }
    ];

    // ✅ Line Items: work order도 번호로 표시
    lineItemColumns = [
        { label: 'Line Number', fieldName: 'LineItemNumber' },
        { label: 'Asset', fieldName: 'assetName' },
        { label: 'Work Order', fieldName: 'workOrderNumber' },
        { label: 'Status', fieldName: 'Status' },
        { label: 'Description', fieldName: 'Description' }
    ];

    connectedCallback() {
        const params = new URLSearchParams(window.location.search);
        this.workOrderId = params.get('workOrderId');
        this.emailParam = params.get('email');

        if (!this.workOrderId) {
            this.errorMessage = 'workOrderId 파라미터가 없습니다. 예: /s/workorder-detail?workOrderId=0WO...';
            return;
        }

        this.fetchDetail();
    }

    get backUrl() {
        return this.emailParam
            ? `/s/mypage?email=${encodeURIComponent(this.emailParam)}`
            : `/s/mypage`;
    }

    async fetchDetail() {
        this.isLoading = true;
        this.errorMessage = null;
        this.data = null;

        try {
            const res = await getWorkOrderDetail({ workOrderId: this.workOrderId });

            // ✅ WorkPlan: Parent Record를 사람이 읽는 번호로 표시
            // - WorkOrderLineItemId가 있으면 LineItemNumber 우선
            // - 아니면 WorkOrderNumber 표시
            const mappedPlans = (res?.workPlans || []).map((p) => {
                const lineItemNo = p.WorkOrderLineItem ? p.WorkOrderLineItem.LineItemNumber : '';
                const woNo = p.WorkOrder ? p.WorkOrder.WorkOrderNumber : '';
                return {
                    ...p,
                    parentRecordDisplay: lineItemNo || woNo || p.ParentRecordId || ''
                };
            });

            // ✅ LineItem: Asset 이름 + WorkOrderNumber 표시
            const mappedLineItems = (res?.lineItems || []).map((li) => ({
                ...li,
                assetName: li.Asset ? li.Asset.Name : '',
                workOrderNumber: li.WorkOrder ? li.WorkOrder.WorkOrderNumber : (li.WorkOrderId || '')
            }));

            this.data = {
                ...res,
                workPlans: mappedPlans,
                lineItems: mappedLineItems
            };
        } catch (e) {
            const msg = e?.body?.message || e?.message || JSON.stringify(e);
            this.errorMessage = `Work Order 상세 조회 실패: ${msg}`;
        } finally {
            this.isLoading = false;
        }
    }
    handleBack() {
        // ✅ 커뮤니티의 올바른 base path를 Salesforce가 제공
        // 예: /customer/s
        const url = this.emailParam
            ? `${basePath}/mypage?email=${encodeURIComponent(this.emailParam)}`
            : `${basePath}/mypage`;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: { url }
        });
    }

}
