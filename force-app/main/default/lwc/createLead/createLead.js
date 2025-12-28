import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createLeadFromJson from '@salesforce/apex/ExperienceLeadController.createLeadFromJson';

export default class CreateLead extends LightningElement {
  isSubmitting = false;

  form = {
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    mobilePhone: '',
    addressDetail: '',
    budget: null,
    monthlyFee: null,
    desiredVisitDate: null,
    requiredFeatures: '',
    consultingSummary: ''
  };

  get submitLabel() {
    return this.isSubmitting ? '저장 중...' : '상담 신청';
  }

  handleInput(e) {
    const key = e.target.dataset.name;
    let value = e.target.value;

    if (key === 'budget' || key === 'monthlyFee') {
      value = value === '' ? null : Number(value);
    }

    this.form = { ...this.form, [key]: value };
  }

  async handleSubmit() {
    this.isSubmitting = true;
    try {
      const payloadJson = JSON.stringify(this.form);

      await createLeadFromJson({ payloadJson });

      this.showToast('완료', '상담 신청이 저장되었습니다.', 'success');

      // 화면/상태 초기화
      this.form = {
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        phone: '',
        mobilePhone: '',
        addressDetail: '',
        budget: null,
        monthlyFee: null,
        desiredVisitDate: null,
        requiredFeatures: '',
        consultingSummary: ''
      };

      this.template.querySelectorAll('input, textarea').forEach((el) => (el.value = ''));
    } catch (err) {
      const msg = err?.body?.message || err?.message || '저장 중 오류가 발생했습니다.';
      this.showToast('오류', msg, 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}