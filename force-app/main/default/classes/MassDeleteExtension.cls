public class MassDeleteExtension {
    private ApexPages.StandardSetController controller;
    
    public MassDeleteExtension(ApexPages.StandardSetController controller) {
        this.controller = controller;
    }
    
    // Property로 노출 (Visualforce에서 {!selectedIds} 형태로 접근)
    public String selectedIds {
        get {
            List<SObject> selectedRecords = controller.getSelected();
            List<String> ids = new List<String>();
            
            for (SObject record : selectedRecords) {
                ids.add(String.valueOf(record.Id));
            }
            
            return String.join(ids, ',');
        }
    }
}