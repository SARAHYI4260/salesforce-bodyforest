import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createLeadFromJson from '@salesforce/apex/ExperienceLeadController.createLeadFromJson';

export default class CreateLead extends LightningElement {
  isSubmitting = false;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobilePhone: '',
    productInterest: '',
    leadSource: ''
  };

  get submitLabel() {
    return this.isSubmitting ? '저장 중...' : '상담 신청';
  }

  handleInput(e) {
    const key = e.target.dataset.name;
    this.form = { ...this.form, [key]: e.target.value };
  }

  handleSelect(e) {
    const key = e.target.dataset.name;
    this.form = { ...this.form, [key]: e.target.value };
  }

  async handleSubmit() {
    // 프론트 필수 체크
    if (!this.form.lastName || this.form.lastName.trim() === '') {
      this.showToast('오류', '성(Last Name)은 필수입니다.', 'error');
      return;
    }

    this.isSubmitting = true;

    try {
      const payloadJson = JSON.stringify(this.form);

      const leadId = await createLeadFromJson({ payloadJson });

      // ✅ 핵심: Id가 없으면 “성공”으로 처리하지 않음
      if (!leadId) {
        this.showToast('오류', '저장되지 않았습니다. (Lead ID를 받지 못했습니다)', 'error');
        return;
      }

      this.showToast('완료', `저장 완료! (Lead ID: ${leadId})`, 'success');

      // 초기화
      this.form = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobilePhone: '',
        productInterest: '',
        leadSource: ''
      };
      this.template.querySelectorAll('input, select').forEach((el) => (el.value = ''));
    } catch (err) {
      // ✅ Apex에서 던진 “저장 실패: …” 메시지가 여기로 옴
      const msg = err?.body?.message || err?.message || '저장되지 않았습니다.';
      this.showToast('오류', msg, 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
