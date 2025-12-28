import { LightningElement, api, wire, track } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import DESCRIPTION_FIELD from '@salesforce/schema/Opportunity.Description';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const FIELDS = [DESCRIPTION_FIELD];

export default class AiTabInsight extends LightningElement {
    @api recordId;
    
    @track analysisText = '분석 중...';
    @track productName = '';
    @track productDesc = '';
    @track scriptText = '';

    isLoading = true;
    isEmpty = false;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            const description = getFieldValue(data, DESCRIPTION_FIELD);
            this.processDescription(description);
            this.isLoading = false;
        } else if (error) {
            console.error('Error retrieving record:', error);
            this.isLoading = false;
        }
    }

    // 텍스트 파싱 로직 (프롬프트의 [ ] 헤더 기준)
    processDescription(text) {
        if (!text || !text.includes('[')) {
            this.isEmpty = true;
            return;
        }
        this.isEmpty = false;

        // 1. 이슈 분석 파싱
        const analysisMatch = text.match(/\[🔍 고객 이슈 분석\]\s*([\s\S]*?)(?=\[|$)/);
        this.analysisText = analysisMatch ? analysisMatch[1].trim() : '분석된 이슈가 없습니다.';

        // 2. 추천 제품 파싱
        const productMatch = text.match(/\[💡 추천 제품\]\s*([\s\S]*?)(?=\[|$)/);
        if (productMatch) {
            const rawProduct = productMatch[1].trim();
            const lines = rawProduct.split('\n');
            // 첫 줄은 제품명, 나머지는 설명으로 분리
            this.productName = lines[0].replace(/[:"-]/g, '').trim(); 
            this.productDesc = lines.slice(1).join(' ');
        } else {
            this.productName = '추천 제품 없음';
        }

        // 3. 세일즈 가이드 파싱
        const scriptMatch = text.match(/\[📞 세일즈 가이드\]\s*([\s\S]*?)(?=\[|$)/);
        this.scriptText = scriptMatch ? scriptMatch[1].trim() : '스크립트가 없습니다.';
    }

    // 스크립트 복사 기능
    handleCopy() {
        if (!this.scriptText) return;

        // 최신 클립보드 API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(this.scriptText);
        } else {
            // 구형 브라우저 호환성 (Fallback)
            const textArea = document.createElement("textarea");
            textArea.value = this.scriptText;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Copy failed', err);
            }
            document.body.removeChild(textArea);
        }

        // 성공 토스트 메시지 표시
        this.dispatchEvent(
            new ShowToastEvent({
                title: '복사 완료',
                message: '세일즈 스크립트가 클립보드에 복사되었습니다.',
                variant: 'success'
            })
        );
    }
}