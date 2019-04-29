$(document).ready(function() {
    $("#buyGoodsForm").validationEngine({
        validationEventTriggers: "blur", //触发的事件  validationEventTriggers:"keyup blur",
        inlineValidation: true, //是否即时验证，false为提交表单时验证,默认true
        success: false, //为true时即使有不符合的也提交表单,false表示只有全部通过验证了才能提交表单,默认false
        promptPosition: "topRight" //提示所在的位置，topLeft, topRight, bottomLeft,  centerRight, bottomRight
        //failure : function() { alert("验证失败，请检查。");  }//验证失败时调用的函数
        //success : function() { callSuccessFunction() },//验证通过时调用的函数
    });

});

function checkID(field, rules, i, options) {
    var re = /(b[0-9]+)/i;

    var id = re.exec(field.val());

    if (!id) {
        return "请正确填写";
    }
}
