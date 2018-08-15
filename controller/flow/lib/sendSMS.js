/**
 * Created by dev03 on 2018/5/29.
 */
const SMSClient = require('@alicloud/sms-sdk');
const accessKeyId = 'LTAIsLdA9mE6KSSS';
const secretAccessKey = 'rHVwibnufgCs9lKEAMZPwYsw4JEwTA';

var SMS = function () {
    let smsClient = new SMSClient({accessKeyId, secretAccessKey});
    this.sendOneSMS = function(PhoneNumbers,SignName,TemplateCode,TemplateParam){
        smsClient.sendSMS({
            PhoneNumbers: PhoneNumbers,
            SignName: SignName,
            TemplateCode: TemplateCode,
            TemplateParam: JSON.stringify(TemplateParam)
        }).then(function (res) {
            let {Code}=res
            if (Code === 'OK') {
                //处理返回参数
                console.log("send phone message success",res)
            }
        }, function (err) {
            console.error("send phone message error",err)
        });
    }
};


module.exports = SMS;