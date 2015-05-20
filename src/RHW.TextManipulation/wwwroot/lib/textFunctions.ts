
enum RuleType { Remove, Replace }


interface RuleParams {
}

class TextReplaceParams implements RuleParams {
    searchValue: string;
    replaceValue: string;
}

class TextRule {
    inputText: string;
    responseText: string;
    ruleType: RuleType;
    ruleParams: RuleParams;

    constructor(inputText: string, ruleType: RuleType, ruleParams: RuleParams) {
        this.inputText = inputText;
        this.ruleType = ruleType;
        this.ruleParams = ruleParams;
    }

    apply() {
        switch (this.ruleType) {
            case RuleType.Remove:
                this.responseText = this.inputText.replace('abc', '');
                break;
        }
    }

}

class RuleSet {
    textRules: TextRule[];
    constructor(textRules: TextRule[]) {

    }
}