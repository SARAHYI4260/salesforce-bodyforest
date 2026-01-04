public without sharing class ExperienceWorkOrderDetailController {

    public class WorkOrderDetailResponse {
        @AuraEnabled public WorkOrder workOrder;
        @AuraEnabled public List<WorkStep> workSteps;
        @AuraEnabled public List<WorkPlan> workPlans;
        @AuraEnabled public List<WorkOrderLineItem> lineItems;
    }

    @AuraEnabled(cacheable=true)
    public static WorkOrderDetailResponse getWorkOrderDetail(String workOrderId) {
        if (String.isBlank(workOrderId)) {
            throw new AuraHandledException('workOrderId 파라미터가 없습니다. 예: /s/workorder-detail?workOrderId=0WO...');
        }

        WorkOrder wo = [
            SELECT Id, WorkOrderNumber, Subject, Status, Priority, Description,
                   StartDate, EndDate, CreatedDate
            FROM WorkOrder
            WHERE Id = :workOrderId
            LIMIT 1
        ];

        // ✅ Work Plans: ParentRecordId + (WorkOrder/LineItem) 번호 표시용 관계필드 포함
        List<WorkPlan> wps = [
            SELECT Id, ParentRecordId, Name, Description, CreatedDate,
                   WorkOrderId, WorkOrder.WorkOrderNumber,
                   WorkOrderLineItemId, WorkOrderLineItem.LineItemNumber
            FROM WorkPlan
            WHERE WorkOrderId = :workOrderId
            ORDER BY CreatedDate ASC
            LIMIT 200
        ];

        Set<Id> wpIds = new Set<Id>();
        for (WorkPlan p : wps) wpIds.add(p.Id);

        List<WorkStep> steps;
        if (!wpIds.isEmpty()) {
            steps = [
                SELECT Id, ExecutionOrder, Name, Status, WorkPlanId, WorkOrderId, CreatedDate
                FROM WorkStep
                WHERE WorkPlanId IN :wpIds
                ORDER BY ExecutionOrder ASC NULLS LAST, CreatedDate ASC
                LIMIT 500
            ];
        } else {
            steps = [
                SELECT Id, ExecutionOrder, Name, Status, WorkPlanId, WorkOrderId, CreatedDate
                FROM WorkStep
                WHERE WorkOrderId = :workOrderId
                ORDER BY ExecutionOrder ASC NULLS LAST, CreatedDate ASC
                LIMIT 500
            ];
        }

        // ✅ Line Items: WorkOrderNumber 표시용 관계필드 포함
        List<WorkOrderLineItem> wolis = [
            SELECT Id, LineItemNumber, AssetId, Asset.Name,
                   WorkOrderId, WorkOrder.WorkOrderNumber,
                   Status, Description, CreatedDate
            FROM WorkOrderLineItem
            WHERE WorkOrderId = :workOrderId
            ORDER BY CreatedDate DESC
            LIMIT 200
        ];

        WorkOrderDetailResponse res = new WorkOrderDetailResponse();
        res.workOrder = wo;
        res.workPlans = wps;
        res.workSteps = steps;
        res.lineItems = wolis;
        return res;
    }
}
