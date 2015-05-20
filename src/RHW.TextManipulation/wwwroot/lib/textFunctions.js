var RuleType;
(function (RuleType) {
    RuleType[RuleType["Remove"] = 0] = "Remove";
    RuleType[RuleType["Replace"] = 1] = "Replace";
})(RuleType || (RuleType = {}));
var TextReplaceParams = (function () {
    function TextReplaceParams() {
    }
    return TextReplaceParams;
})();
var TextRule = (function () {
    function TextRule(inputText, ruleType, ruleParams) {
        this.inputText = inputText;
        this.ruleType = ruleType;
        this.ruleParams = ruleParams;
    }
    TextRule.prototype.apply = function () {
        switch (this.ruleType) {
            case 0 /* Remove */:
                this.responseText = this.inputText.replace('abc', '');
                break;
        }
    };
    return TextRule;
})();
var RuleSet = (function () {
    function RuleSet(textRules) {
    }
    return RuleSet;
})();
