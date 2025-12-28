// LWC의 핵심 기능(LightningElement)과 데이터 연결 기능(wire)을 가져옵니다.
import { LightningElement, wire } from 'lwc';
// 방금 만든 Apex 클래스의 메서드를 가져와서 'getHighPriorityCases'라는 이름으로 씁니다.
import getHighPriorityCases from '@salesforce/apex/caseDashboardController.getHighPriorityCases';

export default class CaseDashboard extends LightningElement {
    // 화면에 뿌려줄 최종 데이터를 담을 변수 (초기값은 빈 배열)
    caseData = [];

    // @wire: Apex 메서드와 이 컴포넌트를 전선(wire)처럼 연결합니다.
    // 데이터가 변경되거나 로드되면 자동으로 이 함수가 실행됩니다.
    @wire(getHighPriorityCases)
    wiredCases({ error, data }) {
        // 1. 데이터를 성공적으로 가져왔을 때
        if (data) {
            // Apex에서 가져온 데이터는 '읽기 전용'이라 수정이 불가능합니다.
            // 그래서 .map()을 써서 새로운 배열로 복사하면서 스타일 정보를 추가합니다.
            this.caseData = data.map(record => {
                
                // 기본 배지 스타일 (회색)
                let priorityClass = 'slds-badge';

                // 우선순위(Priority) 값에 따라 색상 클래스(CSS)를 다르게 붙입니다.
                if (record.Priority === 'High') {
                    priorityClass += ' slds-theme_error'; // 빨간색 (에러 테마)
                } else if (record.Priority === 'Medium') {
                    priorityClass += ' slds-theme_warning'; // 주황색 (경고 테마)
                } else {
                    priorityClass += ' slds-theme_success'; // 초록색 (성공 테마)
                }

                // 기존 레코드 정보(...)에 'priorityClass'라는 스타일 정보를 덧붙여서 반환합니다.
                return { ...record, priorityClass };
            });

        // 2. 데이터를 가져오다 에러가 났을 때
        } else if (error) {
            console.error('데이터를 가져오는 중 오류 발생:', error);
        }
    }

    // 데이터가 하나라도 있는지 확인하는 함수 (HTML에서 if:true로 쓰임)
    get hasCases() {
        return this.caseData.length > 0;
    }
}