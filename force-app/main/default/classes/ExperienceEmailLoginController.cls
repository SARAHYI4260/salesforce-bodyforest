public without sharing class ExperienceEmailLoginController {

    public class OtpResponse {
        @AuraEnabled public Boolean success;
        @AuraEnabled public String message;
        @AuraEnabled public String demoOtp; // 데모: 화면 표시용
    }

    @AuraEnabled
    public static OtpResponse sendOtp(String email) {
        OtpResponse res = new OtpResponse();

        if (String.isBlank(email) || !email.contains('@')) {
            res.success = false;
            res.message = '유효한 이메일을 입력하세요.';
            return res;
        }

        // ✅ 데모 고정 OTP (실서비스면 Email/SMS 발송 로직 필요)
        res.success = true;
        res.message = '인증번호가 발송되었습니다. (데모 OTP: 0000)';
        res.demoOtp = '0000';
        return res;
    }

    @AuraEnabled
    public static OtpResponse verifyOtp(String email, String otp) {
        OtpResponse res = new OtpResponse();

        if (String.isBlank(email) || String.isBlank(otp)) {
            res.success = false;
            res.message = '이메일/인증번호를 입력하세요.';
            return res;
        }

        if (otp == '0000') {
            res.success = true;
            res.message = '로그인 성공';
            return res;
        }

        res.success = false;
        res.message = '인증번호가 올바르지 않습니다. (데모는 0000)';
        return res;
    }
}
