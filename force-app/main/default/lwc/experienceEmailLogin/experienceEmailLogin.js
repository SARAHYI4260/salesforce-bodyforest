import { LightningElement, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ExperienceEmailLogin extends NavigationMixin(LightningElement) {
    @track email = '';
    @track errorMessage = '';

    onChangeEmail(e) {
        this.email = e.target.value;
        this.errorMessage = '';
    }

    get isDisabled() {
        return !this.email || !this.email.includes('@');
    }

    handleLogin() {
        if (this.isDisabled) {
            this.errorMessage = '유효한 이메일을 입력하세요.';
            return;
        }

        const email = this.email.trim();

        // ✅ 커뮤니티는 /s/ 아래에 페이지가 붙는 경우가 많아서 /s/mypage 로 이동
        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/mypage?email=${encodeURIComponent(email)}`
            }
        });
    }
}
