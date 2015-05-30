﻿module StringTransform {

    export enum RuleType { Remove, Replace, Insert }
    export enum RuleLocation { Start, End, Global, BeforeSpecifiedString, AfterSpecifiedString, AtSpecificLocation, OnNewLine }

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
                case RuleLocation.End:
                    removeParams.searchValue += '$';
                case RuleLocation.Start:
                    return StringManip.applyRegEx(inputString, removeParams.searchValue, '', false, true);
                case RuleLocation.Global:
                    return StringManip.applyRegEx(inputString, removeParams.searchValue, '', true, true);
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
            var result = inputString;
            for (var j = 0; j < this.stringRules.length; j++) {
                var sr = this.stringRules[j];
                var stringRule = new StringRule(sr.ruleType, sr.ruleParams);
                result = stringRule.apply(result);
            }
            return result;
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

}

module LineHelper {

    var lineEnding = '\r\n';

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

}

module HtmlHelper {

    export function hideElementsByClassName(className: string): void {
        var locationDetailInputs = <NodeListOf<HTMLElement>>document.getElementsByClassName(className);
        for (var i = 0; i < locationDetailInputs.length; i++) {
            var input = locationDetailInputs[i];
            input.classList.add('hidden');
        }
    }

    export function showElementsByClassName(className: string): void {
        var locationDetailInputs = <NodeListOf<HTMLElement>>document.getElementsByClassName(className);
        for (var i = 0; i < locationDetailInputs.length; i++) {
            var input = locationDetailInputs[i];
            input.classList.remove('hidden');
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

module WebApp {

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
                params = new StringTransform.RemoveParams(detailedLocation,
                    removeView.getInputFieldValue(removeView.removeText));
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
                params = new StringTransform.InsertParams(detailedLocation,
                    insertView.getInputFieldValue(insertView.insertText));
                break;
        }

        validated = true;

        return new InputResult(validated, params);
    }

    export function runTransformation(): boolean {
        var ruleTypeText = HtmlHelper.getSelectedValueByName('ruleType');
        var ruleType = <StringTransform.RuleType>StringTransform.RuleType[ruleTypeText];

        var inputResult = parseInputs(ruleType);
        if (!inputResult.validated) {
            return false;
        }

        var stringRule = new StringTransform.StringRule(ruleType, inputResult.params);
        var rules: StringTransform.StringRule[] = [];
        rules.push(stringRule);

        var ruleSet = new StringTransform.RuleSet(rules);
        var transformInput: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById('transformInput');
        var result: string = ruleSet.apply(transformInput.innerText);
        transformInput.innerText = result;

        return false;
    }

    export function insertRuleLocationChange(): void {
        var ruleLocationText = (<HTMLSelectElement>document.getElementById(Views.InsertView.insertRuleLocation)).value;
        HtmlHelper.hideElementsByClassName('location-details');
        var locationClassName = 'location-' + ruleLocationText;
        HtmlHelper.showElementsByClassName(locationClassName);
    }

    export function ruleTypeChange(): void {
        HtmlHelper.hideElementsByClassName('field-wrapper');
        var ruleTypeText = HtmlHelper.getSelectedValueByName('ruleType');
        var ruleType = <StringTransform.RuleType>StringTransform.RuleType[ruleTypeText];
        var className = 'ruleType-' + ruleTypeText;
        HtmlHelper.showElementsByClassName(className);
        if (ruleType === StringTransform.RuleType.Insert) {
            insertRuleLocationChange();
        }
    }

    export module Views {
        export enum InputType { Text, Number, TextArea, RuleLocationSelect }

        export interface IInputView {
            inputFields: InputField[];
            appendToForm(): void;
        }

        export class BaseView implements IInputView {
            constructor(public ruleType: StringTransform.RuleType, public inputFields: InputField[] = []) {
            }
            appendToForm(): void {
                var form = document.getElementById('inputForm');
                for (var i = 0; i < this.inputFields.length; i++) {
                    form.appendChild(this.inputFields[i].render());
                }
            }
            getInputFieldValue(id: string) {
                for (var i = 0; i < this.inputFields.length; i++) {
                    if (this.inputFields[i].id === id) {
                        return this.inputFields[i].getValue();
                    }
                }
                return '';
            }
        }

        export class InputField {
            constructor(public ruleType: StringTransform.RuleType, public id: string, public labelText: string, public inputType: InputType, public additionalWrapperClasses: string = '') {
            }

            render(): HTMLDivElement {
                var fieldWrapper = document.createElement('div');
                var ruleTypeText = StringTransform.RuleType[this.ruleType];
                fieldWrapper.className = 'hidden field-wrapper ruleType-' + ruleTypeText + ' ' + this.additionalWrapperClasses;
                var label = document.createElement('label');
                label.htmlFor = this.id;
                label.innerText = this.labelText;
                fieldWrapper.appendChild(label);

                switch (this.inputType) {
                    case InputType.Text:
                        var text = document.createElement('input');
                        text.id = this.id;
                        text.type = 'text';
                        fieldWrapper.appendChild(text);
                        break;
                    case InputType.Number:
                        var numberText = document.createElement('input');
                        numberText.id = this.id;
                        numberText.type = 'number';
                        fieldWrapper.appendChild(numberText);
                        break;
                    case InputType.TextArea:
                        var textArea = document.createElement('textarea');
                        textArea.id = this.id;
                        fieldWrapper.appendChild(textArea);
                        break;
                    case InputType.RuleLocationSelect:
                        var ruleLocationSelect = document.createElement('select');
                        ruleLocationSelect.id = this.id;
                        var defaultOption = document.createElement('option');
                        defaultOption.innerText = '--Select--';
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
                        return (<HTMLSelectElement>document.getElementById(this.id)).value;
                }
                return '';
            }
        }

        export class RemoveView extends BaseView {
            removeText: string = 'removeText';
            constructor() {
                super(StringTransform.RuleType.Remove);
                var removeStringField = new InputField(this.ruleType, this.removeText, 'Remove Text:', InputType.TextArea);
                this.inputFields.push(removeStringField);
            }
        }

        export class ReplaceView extends BaseView {
            replaceText: string = 'replaceText';
            replaceWithText: string = 'replaceWithText';
            constructor() {
                super(StringTransform.RuleType.Replace);
                var replaceStringField = new InputField(this.ruleType, this.replaceText, 'Replace Text:', InputType.TextArea);
                this.inputFields.push(replaceStringField);
                var replaceWithStringField = new InputField(this.ruleType, this.replaceWithText, 'Replace With:', InputType.TextArea);
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
                var insertStringField = new InputField(this.ruleType, this.insertText, 'Insert Text:', InputType.TextArea);
                this.inputFields.push(insertStringField);

                var ruleLocationSelect = new InputField(this.ruleType, InsertView.insertRuleLocation, 'Location:', InputType.RuleLocationSelect);
                this.inputFields.push(ruleLocationSelect);

                var classBase = 'hidden location-details location-';
                var classBefore = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.BeforeSpecifiedString];
                var insertBeforeString = new InputField(this.ruleType, this.insertBeforeText, 'Insert Before This Text:', InputType.TextArea, classBefore);
                this.inputFields.push(insertBeforeString);

                var classAfter = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.AfterSpecifiedString];
                var insertAfterString = new InputField(this.ruleType, this.insertAfterText, 'Insert After This Text:', InputType.TextArea, classAfter);
                this.inputFields.push(insertAfterString);

                var classAt = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.AtSpecificLocation];
                var insertAtLoc = new InputField(this.ruleType, this.insertLocation, 'Insert At This Location:', InputType.Number, classAt);
                this.inputFields.push(insertAtLoc);

                var classOnNewLine = classBase + StringTransform.RuleLocation[StringTransform.RuleLocation.OnNewLine];
                var insertOnNewLine = new InputField(this.ruleType, this.insertNewLinesAfterText, 'Insert After Lines That End With:', InputType.TextArea, classOnNewLine);
                this.inputFields.push(insertOnNewLine);
            }
        }

    }

    function render() {

        var removeView = new Views.RemoveView();
        removeView.appendToForm();

        var replaceView = new Views.ReplaceView();
        replaceView.appendToForm();

        var insertView = new Views.InsertView();
        insertView.appendToForm();

        var form = document.getElementById('inputForm');
        var btn = document.createElement('button');
        btn.id = 'btnTransform';
        btn.innerText = 'RUN';
        form.appendChild(btn);
    }

    export function setup() {
        render();
        document.getElementById('btnTransform').onclick = WebApp.runTransformation;
        document.getElementById(Views.InsertView.insertRuleLocation).onchange = WebApp.insertRuleLocationChange;
        var ruleTypeRadios = document.getElementsByName('ruleType');
        for (var i = 0; i < ruleTypeRadios.length; i++) {
            (<HTMLInputElement>ruleTypeRadios[i]).onclick = WebApp.ruleTypeChange;
        }
    }
}

window.onload = () => {
    WebApp.setup();
}