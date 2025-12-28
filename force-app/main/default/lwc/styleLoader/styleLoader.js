import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
// 'SpruceGlobalTheme'은 아까 Static Resource에 올린 이름과 똑같아야 합니다.
import SpruceTheme from '@salesforce/resourceUrl/SpruceGlobalTheme'; 

export default class StyleLoader extends LightningElement {
    isCssLoaded = false;

    renderedCallback() {
        if (this.isCssLoaded) {
            return;
        }
        
        // CSS 파일 로딩 실행
        loadStyle(this, SpruceTheme)
            .then(() => {
                console.log('Global Spruce Theme Loaded Successfully');
                this.isCssLoaded = true;
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
            });
    }
}