import { LightningElement, track } from 'lwc';
import getMyPageData from '@salesforce/apex/ExperienceMyPageController.getMyPageData';

export default class ExperienceMyPage extends LightningElement {
    @track emailParam;
    @track data;
    @track errorMessage;
    @track isLoading = false;

    caseColumns = [
        {
            label: 'Case Number',
            fieldName: 'caseLink',
            type: 'url',
            typeAttributes: {
                label: { fieldName: 'CaseNumber' },
                target: '_self'
            }
        },
        { label: 'Subject', fieldName: 'Subject' },
        { label: 'Status', fieldName: 'Status' },
        { label: 'Priority', fieldName: 'Priority' },
        { label: 'Created', fieldName: 'CreatedDate', type: 'date' }
    ];

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
        { label: 'Status', fieldName: 'Status' },
        { label: 'Start', fieldName: 'StartDate', type: 'date' },
        { label: 'End', fieldName: 'EndDate', type: 'date' }
    ];

    connectedCallback() {
        const params = new URLSearchParams(window.location.search);
        this.emailParam = params.get('email');
        this.fetchData();
    }

    async fetchData() {
        this.isLoading = true;
        this.errorMessage = null;
        this.data = null;

        try {
            const res = await getMyPageData({ email: this.emailParam });

            const mappedCases = (res?.cases || []).map((c) => ({
                ...c,
                caseLink: `/case-detail?caseId=${c.Id}&email=${encodeURIComponent(this.emailParam || '')}`
            }));

            const mappedWos = (res?.workOrders || []).map((w) => ({
                ...w,
                workOrderLink: `/workorder-detail?workOrderId=${w.Id}&email=${encodeURIComponent(this.emailParam || '')}`
            }));

            this.data = {
                ...res,
                cases: mappedCases,
                workOrders: mappedWos
            };
        } catch (e) {
            this.errorMessage =
                e?.body?.message || e?.message || '데이터 조회 중 오류가 발생했습니다.';
        } finally {
            this.isLoading = false;
        }
    }
}
