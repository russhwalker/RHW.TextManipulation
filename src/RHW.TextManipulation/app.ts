module StringTransform {

    export enum RuleType { Remove, Replace, Insert, Other, Mangle }

    export enum RuleLocation { Start, End, Global, BeforeSpecifiedString, AfterSpecifiedString, AtSpecificLocation, OnNewLine, FirstOccurrence, LastOccurrence }
    export enum MangleRule { StaticText, SubString }

    export class DetailedLocation {
        constructor(public ruleLocation: RuleLocation = RuleLocation.Global,
            public beforeString: string = '',
            public afterString: string = '',
            public specificLocationIndex: number = null,
            public onNewLineAfterText: string = '') {
        }
    }

    export interface IRuleParams {
        detailedLocation: DetailedLocation;
    }

    export class RuleParamsBase implements IRuleParams {
        constructor(public detailedLocation: DetailedLocation) {
        }
    }

    export class ReplaceParams extends RuleParamsBase {
        searchValue: string;
        replaceValue: string;
        constructor(detailedLocation: DetailedLocation, searchValue: string, replaceValue: string) {
            this.searchValue = searchValue;
            this.replaceValue = replaceValue;
            super(detailedLocation);
        }
    }

    export class RemoveParams extends RuleParamsBase {
        searchValue: string;
        constructor(detailedLocation: DetailedLocation, searchValue: string) {
            this.searchValue = searchValue;
            super(detailedLocation);
        }
    }

    export class InsertParams extends RuleParamsBase {
        insertValue: string;
        constructor(detailedLocation: DetailedLocation, insertValue: string) {
            this.insertValue = insertValue;
            super(detailedLocation);
        }
    }

    export class StringRule {
        constructor(public ruleType: RuleType, public ruleParams: IRuleParams) {
        }

        private applyRemove(inputString: string): string {
            var removeParams = <RemoveParams>this.ruleParams;
            switch (removeParams.detailedLocation.ruleLocation) {
                case RuleLocation.Global:
                    return StringManip.applyRegEx(inputString, removeParams.searchValue, '', true, true);
                case RuleLocation.FirstOccurrence:
                    return StringManip.applyRegEx(inputString, removeParams.searchValue, '', false, true);
                case RuleLocation.LastOccurrence:
                    var stringLocations = StringManip.getStringIndexes(inputString, removeParams.searchValue);
                    if (stringLocations && stringLocations.length > 0) {
                        var lastOccurrence = stringLocations.slice(-1);
                        return StringManip.removeStrings(inputString, removeParams.searchValue, lastOccurrence);
                    }
            }
            return inputString;
        }

        private applyReplace(inputString: string): string {
            var replaceParams = <ReplaceParams>this.ruleParams;
            switch (replaceParams.detailedLocation.ruleLocation) {
                case RuleLocation.End:
                    replaceParams.searchValue += '$';
                case RuleLocation.Start:
                    return StringManip.applyRegEx(inputString, replaceParams.searchValue, replaceParams.replaceValue, false, true);
                case RuleLocation.Global:
                    return StringManip.applyRegEx(inputString, replaceParams.searchValue, replaceParams.replaceValue, true, true);
            }
            return inputString;
        }

        private applyInsert(inputString: string): string {
            var insertParams = <InsertParams>this.ruleParams;

            var stringLocations: number[];

            switch (insertParams.detailedLocation.ruleLocation) {
                case RuleLocation.Start:
                    return insertParams.insertValue + inputString;
                case RuleLocation.End:
                    return inputString + insertParams.insertValue;
                case RuleLocation.BeforeSpecifiedString:
                    stringLocations = StringManip.getStringIndexes(inputString, insertParams.detailedLocation.beforeString);
                    return StringManip.insertBefore(inputString, insertParams.insertValue, stringLocations);
                case RuleLocation.AfterSpecifiedString:
                    stringLocations = StringManip.getStringIndexes(inputString, insertParams.detailedLocation.afterString);
                    return StringManip.insertAfter(inputString, insertParams.insertValue, stringLocations);
                case RuleLocation.AtSpecificLocation:
                    return StringManip.insertBefore(inputString, insertParams.insertValue, [insertParams.detailedLocation.specificLocationIndex]);
                case RuleLocation.OnNewLine:
                    return LineHelper.insertNewLine(inputString, insertParams.insertValue, insertParams.detailedLocation.onNewLineAfterText);
            }
            return inputString;
        }

        apply(inputString: string): string {
            switch (this.ruleType) {
                case RuleType.Remove:
                    return this.applyRemove(inputString);
                case RuleType.Replace:
                    return this.applyReplace(inputString);
                case RuleType.Insert:
                    return this.applyInsert(inputString);
            }
            return inputString;
        }

    }

    export class RuleSet {
        constructor(public stringRules: StringRule[] = []) {
        }

        apply(inputString: string): string {
            var lines = LineHelper.parseLines(inputString);
            var resultLines: string[] = [];

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];

                for (var j = 0; j < this.stringRules.length; j++) {
                    var sr = this.stringRules[j];
                    var stringRule = new StringRule(sr.ruleType, sr.ruleParams);
                    line = stringRule.apply(line);
                }

                resultLines.push(line);
            }

            return resultLines.join(LineHelper.lineEnding);
        }
    }

}

module StringManip {

    export function applyRegEx(intputString: string, pattern: string, replaceValue: string, isGlobal: boolean, ignoreCase: boolean, multiLine: boolean = true): string {
        var flags = isGlobal ? 'g' : '';
        if (ignoreCase) {
            flags += 'i';
        }
        if (multiLine) {
            flags += 'm';
        }
        var regexReplace = new RegExp(pattern, flags);
        return intputString.replace(regexReplace, replaceValue);
    }

    export function getStringIndexes(inputString: string, pattern: string): number[] {
        var regex = new RegExp(pattern, 'gi');
        var result: RegExpExecArray, indices = [];
        while ((result = regex.exec(inputString))) {
            indices.push(result.index);
        }
        return indices;
    }

    export function insertBefore(inputString: string, insertValue: string, locations: number[]): string {
        var result = inputString;
        var locationChange = 0;
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var before = result.substring(0, location);
            var after = result.substring(location);
            result = before + insertValue + after;
            locationChange += insertValue.length;
        }
        return result;
    }

    export function insertAfter(inputString: string, insertValue: string, locations: number[]): string {
        var result = inputString;
        var locationChange = 0;
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var before = result.substring(0, location + (insertValue.length - 1) + locationChange);
            var after = result.substring(location + insertValue.length + locationChange);
            result = before + insertValue + after;
            locationChange += insertValue.length;
        }
        return result;
    }

    export function removeStrings(inputString: string, stringToRemove: string, locations: number[]): string {
        var result = inputString;
        var locationChange = 0;
        for (var i = 0; i < locations.length; i++) {
            var location = locations[i];
            var before = result.substring(0, location);
            var after = result.substring(location + stringToRemove.length);
            result = before + after;
            locationChange -= stringToRemove.length;
        }
        return result;
    }

}

module LineHelper {

    export var lineEnding = '\r\n';

    export function parseLines(rawInput: string): string[] {
        var lines = rawInput.split(lineEnding);
        return lines;
    }

    export function removeLineBreak(line: string): string {
        return StringManip.applyRegEx(line, lineEnding, '', true, true);
    }

    export function insertNewLine(input: string, newLineText: string, afterLineWithText: string): string {
        var lines = input.split(lineEnding);
        var resultLines: string[] = [];
        for (var i = 0; i < lines.length; i++) {
            var line = removeLineBreak(lines[i]);
            resultLines.push(line);
            if (line.indexOf(afterLineWithText, line.length - afterLineWithText.length) !== -1) {
                resultLines.push(newLineText);
            }
        }
        return resultLines.join(lineEnding);
    }

    export function trimLines(input: string) {
        var lines = input.split(lineEnding);
        var resultLines: string[] = [];
        for (var i = 0; i < lines.length; i++) {
            var line = removeLineBreak(lines[i]);
            resultLines.push(line.trim());
        }
        return resultLines.join(lineEnding);
    }

}

module WebApp {

    var transformInputId: string = 'transformInput';
    var transformButtonId: string = 'btnTransform';

    export class InputResult {
        constructor(public validated: boolean, public params: StringTransform.IRuleParams) {

        }
    }

    export function parseInputs(ruleType: StringTransform.RuleType): InputResult {
        var validated = false;
        var params: StringTransform.IRuleParams;
        var detailedLocation = new StringTransform.DetailedLocation();
        switch (ruleType) {
            case StringTransform.RuleType.Replace:
                var replaceView = new Views.ReplaceView();
                params = new StringTransform.ReplaceParams(detailedLocation,
                    replaceView.getInputFieldValue(replaceView.replaceText),
                    replaceView.getInputFieldValue(replaceView.replaceWithText));
                break;
            case StringTransform.RuleType.Remove:
                var removeView = new Views.RemoveView();
                var removeRuleLocationText = removeView.getInputFieldValue(Views.RemoveView.removeRuleLocation);
                detailedLocation.ruleLocation = StringTransform.RuleLocation[removeRuleLocationText];
                params = new StringTransform.RemoveParams(detailedLocation, removeView.getInputFieldValue(removeView.removeText));
                break;
            case StringTransform.RuleType.Insert:
                var insertView = new Views.InsertView();
                var ruleLocationText = insertView.getInputFieldValue(Views.InsertView.insertRuleLocation);
                detailedLocation.ruleLocation = StringTransform.RuleLocation[ruleLocationText];
                detailedLocation.beforeString = insertView.getInputFieldValue(insertView.insertBeforeText);
                detailedLocation.afterString = insertView.getInputFieldValue(insertView.insertAfterText);
                var insertLocation = insertView.getInputFieldValue(insertView.insertLocation);
                detailedLocation.specificLocationIndex = parseInt(insertLocation);
                detailedLocation.onNewLineAfterText = insertView.getInputFieldValue(insertView.insertNewLinesAfterText);
                params = new StringTransform.InsertParams(detailedLocation, insertView.getInputFieldValue(insertView.insertText));
                break;
        }

        validated = true;
        //todo validation
        return new InputResult(validated, params);
    }

    export function runTransformation(): boolean {

        var ruleTypeText = '';
        var ruleTypeAnchors = document.getElementsByClassName('ruleType');
        for (var i = 0; i < ruleTypeAnchors.length; i++) {
            var ruleTypeAnchor = <HTMLAnchorElement>ruleTypeAnchors[i];
            if (ruleTypeAnchor.classList.contains('active')) {
                ruleTypeText = ruleTypeAnchor.dataset['mangleRule'];
            }
        }

        var ruleType = <StringTransform.RuleType>StringTransform.RuleType[ruleTypeText];

        var inputResult = parseInputs(ruleType);
        if (!inputResult.validated) {
            return false;
        }

        var stringRule = new StringTransform.StringRule(ruleType, inputResult.params);
        var rules: StringTransform.StringRule[] = [];
        rules.push(stringRule);

        var ruleSet = new StringTransform.RuleSet(rules);
        var transformInput: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById(transformInputId);
        var result: string = ruleSet.apply(transformInput.innerText);
        transformInput.innerText = result;

        return false;
    }

    export function insertRuleLocationChange(): void {
        var ruleLocationText = (<HTMLSelectElement>document.getElementById(Views.InsertView.insertRuleLocation)).value;
        HtmlHelper.hideElementsByClassName('location-details');
        var locationClassName = 'location-' + ruleLocationText;
        HtmlHelper.displayElementsByClassName(locationClassName);
    }

    export function ruleTypeChange(): boolean {
        var ruleTypeAnchor = <HTMLAnchorElement>this;
        var ruleTypeItems: NodeList = ruleTypeAnchor.parentNode.childNodes;
        for (var i = 0; i < ruleTypeItems.length; i++) {
            var childItem = <HTMLAnchorElement>ruleTypeItems[i];
            if (childItem && childItem.classList) {
                childItem.classList.remove('active');
            }
        }
        ruleTypeAnchor.classList.add('active');

        HtmlHelper.hideElementsByClassName('field-wrapper');
        var ruleTypeText: string = this.dataset.ruletype;
        var ruleType = <StringTransform.RuleType>StringTransform.RuleType[ruleTypeText];
        var className = 'ruleType-' + ruleTypeText;
        HtmlHelper.displayElementsByClassName(className);
        HtmlHelper.hideElementById(transformButtonId);

        switch (ruleType) {
            case StringTransform.RuleType.Other:
                break;
            case StringTransform.RuleType.Insert:
                HtmlHelper.displayElementsById(transformButtonId);
                insertRuleLocationChange();
                break;
            default:
                HtmlHelper.displayElementsById(transformButtonId);
                break;
        }
        return false;
    }

    export module Views {

        export enum InputType { Text, Number, TextArea, RuleLocationSelect, RemoveLocationSelect, Button, Div }

        export interface IInputView {
            inputFields: InputField[];
            appendToForm(): void;
        }

        export class BaseView implements IInputView {
            constructor(public ruleType: StringTransform.RuleType, public inputFields: InputField[] = []) {
            }

            appendToForm(): void {
                var rulesWrapper = document.getElementById('rules');
                for (var i = 0; i < this.inputFields.length; i++) {
                    rulesWrapper.appendChild(this.inputFields[i].render());
                }
            }

            getInputFieldValue(id: string) {
                for (var i = 0; i < this.inputFields.length; i++) {
                    var inputField = this.inputFields[i];
                    if (inputField.id === id) {
                        return this.inputFields[i].getValue();
                    }
                }
                return '';
            }
        }

        export class InputField {
            constructor(public ruleType: StringTransform.RuleType,
                public id: string,
                public inputType: InputType,
                public labelText: string = '',
                public placeHolderText: string = '',
                public additionalWrapperClasses: string = '',
                public buttonText: string = '',
                public buttonClickEvent: any = null,
                public mangleRule: StringTransform.MangleRule = null) {
            }

            render(): HTMLDivElement {
                var fieldWrapper = document.createElement('div');
                var ruleTypeText = StringTransform.RuleType[this.ruleType];
                fieldWrapper.className = 'hidden field-wrapper ruleType-' + ruleTypeText + ' ' + this.additionalWrapperClasses;

                if (this.labelText !== '') {
                    var label = document.createElement('label');
                    label.htmlFor = this.id;
                    label.innerText = this.labelText;
                    fieldWrapper.appendChild(label);
                }

                switch (this.inputType) {
                    case InputType.Text:
                        var text = document.createElement('input');
                        text.className = 'form-control';
                        text.id = this.id;
                        text.type = 'text';
                        text.placeholder = this.placeHolderText;
                        fieldWrapper.appendChild(text);
                        break;
                    case InputType.Number:
                        var numberText = document.createElement('input');
                        numberText.className = 'form-control';
                        numberText.id = this.id;
                        numberText.type = 'number';
                        numberText.placeholder = this.placeHolderText;
                        fieldWrapper.appendChild(numberText);
                        break;
                    case InputType.TextArea:
                        var textArea = document.createElement('textarea');
                        textArea.className = 'form-control';
                        textArea.id = this.id;
                        textArea.placeholder = this.placeHolderText;
                        fieldWrapper.appendChild(textArea);
                        break;
                    case InputType.RuleLocationSelect:
                        var ruleLocationSelect = document.createElement('select');
                        ruleLocationSelect.className = 'form-control';
                        ruleLocationSelect.id = this.id;

                        var defaultOption = document.createElement('option');
                        defaultOption.innerText = '--Select Location--';
                        defaultOption.value = '';
                        defaultOption.selected = true;
                        ruleLocationSelect.appendChild(defaultOption);

                        var optionStart = document.createElement('option');
                        optionStart.innerText = 'Start';
                        optionStart.value = StringTransform.RuleLocation[StringTransform.RuleLocation.Start];
                        ruleLocationSelect.appendChild(optionStart);

                        var optionEnd = document.createElement('option');
                        optionEnd.innerText = 'End';
                        optionEnd.value = StringTransform.RuleLocation[StringTransform.RuleLocation.End];
                        ruleLocationSelect.appendChild(optionEnd);

                        var optionBeforeSpecText = document.createElement('option');
                        optionBeforeSpecText.innerText = 'Before Specific Text';
                        optionBeforeSpecText.value = StringTransform.RuleLocation[StringTransform.RuleLocation.BeforeSpecifiedString];
                        ruleLocationSelect.appendChild(optionBeforeSpecText);

                        var optionAfterSpecText = document.createElement('option');
                        optionAfterSpecText.innerText = 'After Specific Text';
                        optionAfterSpecText.value = StringTransform.RuleLocation[StringTransform.RuleLocation.AfterSpecifiedString];
                        ruleLocationSelect.appendChild(optionAfterSpecText);

                        var optionAtSpecLoc = document.createElement('option');
                        optionAtSpecLoc.innerText = 'At Specific Number Location';
                        optionAtSpecLoc.value = StringTransform.RuleLocation[StringTransform.RuleLocation.AtSpecificLocation];
                        ruleLocationSelect.appendChild(optionAtSpecLoc);

                        var optionOnNewLine = document.createElement('option');
                        optionOnNewLine.innerText = 'On A New Line';
                        optionOnNewLine.value = StringTransform.RuleLocation[StringTransform.RuleLocation.OnNewLine];
                        ruleLocationSelect.appendChild(optionOnNewLine);

                        fieldWrapper.appendChild(ruleLocationSelect);
                        break;
                    case InputType.RemoveLocationSelect:
                        var removeLocationSelect = document.createElement('select');
                        removeLocationSelect.className = 'form-control';
                        removeLocationSelect.id = this.id;

                        var defaultRemoveOption = document.createElement('option');
                        defaultRemoveOption.innerText = '--Select Location--';
                        defaultRemoveOption.value = '';
                        defaultRemoveOption.selected = true;
                        removeLocationSelect.appendChild(defaultRemoveOption);

                        var removeOptionGlobal = document.createElement('option');
                        removeOptionGlobal.innerText = 'Anywhere/Global';
                        removeOptionGlobal.value = StringTransform.RuleLocation[StringTransform.RuleLocation.Global];
                        removeLocationSelect.appendChild(removeOptionGlobal);

                        var removeOptionFirstOcc = document.createElement('option');
                        removeOptionFirstOcc.innerText = 'First Occurrence';
                        removeOptionFirstOcc.value = StringTransform.RuleLocation[StringTransform.RuleLocation.FirstOccurrence];
                        removeLocationSelect.appendChild(removeOptionFirstOcc);

                        var removeOptionLastOcc = document.createElement('option');
                        removeOptionLastOcc.innerText = 'Last Occurrence';
                        removeOptionLastOcc.value = StringTransform.RuleLocation[StringTransform.RuleLocation.LastOccurrence];
                        removeLocationSelect.appendChild(removeOptionLastOcc);

                        fieldWrapper.appendChild(removeLocationSelect);
                        break;
                    case InputType.Button:
                        var btn = document.createElement('button');
                        btn.id = this.id;
                        btn.innerText = this.buttonText;
                        btn.className = 'btn btn-info';
                        btn.onclick = this.buttonClickEvent;
                        btn.dataset['mangleRule'] = StringTransform.MangleRule[this.mangleRule];
                        fieldWrapper.appendChild(btn);
                        break;
                    case InputType.Div:
                        var div = document.createElement('div');
                        div.id = this.id;
                        fieldWrapper.appendChild(div);
                        break;
                }

                return fieldWrapper;
            }

            getValue(): string {
                switch (this.inputType) {
                    case InputType.Text:
                    case InputType.Number:
                        return (<HTMLInputElement>document.getElementById(this.id)).value;
                    case InputType.TextArea:
                        return (<HTMLTextAreaElement>document.getElementById(this.id)).value;
                    case InputType.RuleLocationSelect:
                    case InputType.RemoveLocationSelect:
                        return (<HTMLSelectElement>document.getElementById(this.id)).value;
                }
                return '';
            }
        }

        export class RemoveView extends BaseView {
            removeText: string = 'removeText';
            static removeRuleLocation: string = 'removeRuleLocation';
            constructor() {
                super(StringTransform.RuleType.Remove);
                var removeLocationSelect = new InputField(this.ruleType, RemoveView.removeRuleLocation, InputType.RemoveLocationSelect);
                this.inputFields.push(removeLocationSelect);
                var removeStringField = new InputField(this.ruleType, this.removeText, InputType.TextArea, '', 'Remove This Text');
                this.inputFields.push(removeStringField);
            }
        }

        export class ReplaceView extends BaseView {
            replaceText: string = 'replaceText';
            replaceWithText: string = 'replaceWithText';
            constructor() {
                super(StringTransform.RuleType.Replace);
                var replaceStringField = new InputField(this.ruleType, this.replaceText, InputType.TextArea, '', 'Replace This Text');
                this.inputFields.push(replaceStringField);
                var replaceWithStringField = new InputField(this.ruleType, this.replaceWithText, InputType.TextArea, '', 'With This Text');
                this.inputFields.push(replaceWithStringField);
            }
        }

        export class InsertView extends BaseView {
            insertText: string = 'insertText';
            static insertRuleLocation: string = 'insertRuleLocation';
            insertBeforeText: string = 'insertBeforeText';
            insertAfterText: string = 'insertAfterText';
            insertLocation: string = 'insertLocation';
            insertNewLinesAfterText: string = 'insertNewLinesAfterText';
            constructor() {
                super(StringTransform.RuleType.Insert);
                var insertStringField = new InputField(this.ruleType, this.insertText, InputType.TextArea, '', 'Insert This Text');
                this.inputFields.push(insertStringField);

                var ruleLocationSelect = new InputField(this.ruleType, InsertView.insertRuleLocation, InputType.RuleLocationSelect, '', 'Location:');
                this.inputFields.push(ruleLocationSelect);

                var classBase = 'hidden location-details location-';
                var classBefore = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.BeforeSpecifiedString];
                var insertBeforeString = new InputField(this.ruleType, this.insertBeforeText, InputType.TextArea, '', 'Insert Before This Text', classBefore);
                this.inputFields.push(insertBeforeString);

                var classAfter = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.AfterSpecifiedString];
                var insertAfterString = new InputField(this.ruleType, this.insertAfterText, InputType.TextArea, '', 'Insert After This Text', classAfter);
                this.inputFields.push(insertAfterString);

                var classAt = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.AtSpecificLocation];
                var insertAtLoc = new InputField(this.ruleType, this.insertLocation, InputType.Number, '', 'Insert At This Location', classAt);
                this.inputFields.push(insertAtLoc);

                var classOnNewLine = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.OnNewLine];
                var insertOnNewLine = new InputField(this.ruleType, this.insertNewLinesAfterText, InputType.TextArea, '', 'Insert After Lines That End With', classOnNewLine);
                this.inputFields.push(insertOnNewLine);
            }
        }

        export class OtherView extends BaseView {
            static trimLinesId: string = 'btnTrimLines';
            static formatJSONId: string = 'btnFormatJSON';
            constructor() {
                super(StringTransform.RuleType.Other);
                var btnTrim = new InputField(this.ruleType, OtherView.trimLinesId, InputType.Button, '', '', '', 'Trim', QuickRules.runTrimLines);
                this.inputFields.push(btnTrim);
                var btnFormatJSON = new InputField(this.ruleType, OtherView.formatJSONId, InputType.Button, '', '', '', 'Format JSON', QuickRules.formatJSON);
                this.inputFields.push(btnFormatJSON);
            }
        }

        export class MangleView extends BaseView {
            static btnStaticTextId = 'btnMangleStaticText';
            static mangleRulesWrapperId = 'mangleRulesWrapper';
            constructor() {
                super(StringTransform.RuleType.Mangle);

                var btnStaticText = new InputField(this.ruleType, MangleView.btnStaticTextId, InputType.Button,
                    '', '', '', 'Static Text', addMangleRule, StringTransform.MangleRule.StaticText);
                this.inputFields.push(btnStaticText);

                var btnSubString = new InputField(this.ruleType, MangleView.btnStaticTextId, InputType.Button,
                    '', '', '', 'SubString', addMangleRule, StringTransform.MangleRule.SubString);
                this.inputFields.push(btnSubString);

                var mangleRuleWrapper = new InputField(this.ruleType, MangleView.mangleRulesWrapperId, InputType.Div);
                this.inputFields.push(mangleRuleWrapper);
            }
        }

        export function addMangleRule(): boolean {
            var btn = <HTMLButtonElement>this;
            var mangleRule = StringTransform.MangleRule[<string>btn.dataset['mangleRule']];
            var mangleRulesWrapper = document.getElementById(MangleView.mangleRulesWrapperId);
            var singleRuleWrapper = document.createElement('div');
            singleRuleWrapper.className = 'rule-wrapper';
            switch (mangleRule) {
                case StringTransform.MangleRule.StaticText:
                    var txtStaticText = document.createElement('input');
                    txtStaticText.type = 'text';
                    txtStaticText.placeholder = 'Static Text';
                    singleRuleWrapper.appendChild(txtStaticText);
                    break;
                case StringTransform.MangleRule.SubString:
                    var txtStartText = document.createElement('input');
                    txtStartText.type = 'text';
                    txtStartText.className = '';
                    txtStartText.placeholder = 'Start At This Text';
                    singleRuleWrapper.appendChild(txtStartText);
                    var txtEndText = document.createElement('input');
                    txtEndText.type = 'text';
                    txtEndText.className = '';
                    txtEndText.placeholder = 'End At This Text';
                    singleRuleWrapper.appendChild(txtEndText);
                    var txtStartIndex = document.createElement('input');
                    txtStartIndex.type = 'text';
                    txtStartIndex.className = 'short';
                    txtStartIndex.placeholder = 'Start Index';
                    singleRuleWrapper.appendChild(txtStartIndex);
                    var txtEndIndex = document.createElement('input');
                    txtEndIndex.type = 'text';
                    txtEndIndex.className = 'short';
                    txtEndIndex.placeholder = 'End Index';
                    singleRuleWrapper.appendChild(txtEndIndex);
                    break;
            }
            var anchorRemove = document.createElement('a');
            anchorRemove.href = '#';
            anchorRemove.innerText = 'X';
            anchorRemove.onclick = removeMangleRule;
            singleRuleWrapper.appendChild(anchorRemove);
            mangleRulesWrapper.appendChild(singleRuleWrapper);
            return false;
        }

        export function removeMangleRule(): boolean {
            var anchor = <HTMLAnchorElement>this;
            var singleRuleWrapper = <HTMLDivElement>anchor.parentNode;
            singleRuleWrapper.removeNode(true);
            return false;
        }

    }

    function render() {
        var removeView = new Views.RemoveView();
        removeView.appendToForm();

        var replaceView = new Views.ReplaceView();
        replaceView.appendToForm();

        var insertView = new Views.InsertView();
        insertView.appendToForm();

        var mangleView = new Views.MangleView();
        mangleView.appendToForm();

        var otherView = new Views.OtherView();
        otherView.appendToForm();
    }

    export function setup() {
        render();

        document.getElementById(transformButtonId).onclick = WebApp.runTransformation;
        document.getElementById(Views.InsertView.insertRuleLocation).onchange = WebApp.insertRuleLocationChange;
        var ruleTypeItems = document.getElementsByClassName('ruleType');
        for (var i = 0; i < ruleTypeItems.length; i++) {
            (<HTMLAnchorElement>ruleTypeItems[i]).onclick = WebApp.ruleTypeChange;
        }
    }

    export module QuickRules {

        export function runTrimLines(): boolean {
            var transformInput: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById(transformInputId);
            transformInput.innerText = LineHelper.trimLines(transformInput.innerText);
            return false;
        }

        export function formatJSON(): boolean {
            var transformInput: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById(transformInputId);
            var obj = JSON.parse(transformInput.innerText);
            transformInput.innerText = JSON.stringify(obj, null, 2);
            return false;
        }

    }

    module HtmlHelper {

        var hiddenClass: string = 'hidden';

        export function hideElementById(id: string): void {
            var element = document.getElementById(id);
            element.classList.add(hiddenClass);
        }

        export function displayElementsById(id: string): void {
            var element = document.getElementById(id);
            element.classList.remove(hiddenClass);
        }

        export function hideElementsByClassName(className: string): void {
            var locationDetailInputs = <NodeListOf<HTMLElement>>document.getElementsByClassName(className);
            for (var i = 0; i < locationDetailInputs.length; i++) {
                var input = locationDetailInputs[i];
                input.classList.add(hiddenClass);
            }
        }

        export function displayElementsByClassName(className: string): void {
            var locationDetailInputs = <NodeListOf<HTMLElement>>document.getElementsByClassName(className);
            for (var i = 0; i < locationDetailInputs.length; i++) {
                var input = locationDetailInputs[i];
                input.classList.remove(hiddenClass);
            }
        }

        export function getSelectedValueByName(name: string): string {
            var ruleTypeRadios = document.getElementsByName(name);
            for (var i = 0; i < ruleTypeRadios.length; i++) {
                var ruleTypeRadio = <HTMLInputElement>ruleTypeRadios[i];
                if (ruleTypeRadio.checked) {
                    return ruleTypeRadio.value;
                }
            }
            return '';
        }

    }

}

window.onload = () => {
    WebApp.setup();
}
