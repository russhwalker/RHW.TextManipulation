var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var StringTransform;
(function (StringTransform) {
    (function (RuleType) {
        RuleType[RuleType["Remove"] = 0] = "Remove";
        RuleType[RuleType["Replace"] = 1] = "Replace";
        RuleType[RuleType["Insert"] = 2] = "Insert";
        RuleType[RuleType["Other"] = 3] = "Other";
        RuleType[RuleType["Mangle"] = 4] = "Mangle";
    })(StringTransform.RuleType || (StringTransform.RuleType = {}));
    var RuleType = StringTransform.RuleType;
    (function (RuleLocation) {
        RuleLocation[RuleLocation["Start"] = 0] = "Start";
        RuleLocation[RuleLocation["End"] = 1] = "End";
        RuleLocation[RuleLocation["Global"] = 2] = "Global";
        RuleLocation[RuleLocation["BeforeSpecifiedString"] = 3] = "BeforeSpecifiedString";
        RuleLocation[RuleLocation["AfterSpecifiedString"] = 4] = "AfterSpecifiedString";
        RuleLocation[RuleLocation["AtSpecificLocation"] = 5] = "AtSpecificLocation";
        RuleLocation[RuleLocation["OnNewLine"] = 6] = "OnNewLine";
        RuleLocation[RuleLocation["FirstOccurrence"] = 7] = "FirstOccurrence";
        RuleLocation[RuleLocation["LastOccurrence"] = 8] = "LastOccurrence";
    })(StringTransform.RuleLocation || (StringTransform.RuleLocation = {}));
    var RuleLocation = StringTransform.RuleLocation;
    (function (MangleRule) {
        MangleRule[MangleRule["StaticText"] = 0] = "StaticText";
        MangleRule[MangleRule["SubString"] = 1] = "SubString";
    })(StringTransform.MangleRule || (StringTransform.MangleRule = {}));
    var MangleRule = StringTransform.MangleRule;
    var DetailedLocation = (function () {
        function DetailedLocation(ruleLocation, beforeString, afterString, specificLocationIndex, onNewLineAfterText) {
            if (ruleLocation === void 0) { ruleLocation = 2 /* Global */; }
            if (beforeString === void 0) { beforeString = ''; }
            if (afterString === void 0) { afterString = ''; }
            if (specificLocationIndex === void 0) { specificLocationIndex = null; }
            if (onNewLineAfterText === void 0) { onNewLineAfterText = ''; }
            this.ruleLocation = ruleLocation;
            this.beforeString = beforeString;
            this.afterString = afterString;
            this.specificLocationIndex = specificLocationIndex;
            this.onNewLineAfterText = onNewLineAfterText;
        }
        return DetailedLocation;
    })();
    StringTransform.DetailedLocation = DetailedLocation;
    var RuleParamsBase = (function () {
        function RuleParamsBase(detailedLocation) {
            this.detailedLocation = detailedLocation;
        }
        return RuleParamsBase;
    })();
    StringTransform.RuleParamsBase = RuleParamsBase;
    var ReplaceParams = (function (_super) {
        __extends(ReplaceParams, _super);
        function ReplaceParams(detailedLocation, searchValue, replaceValue) {
            this.searchValue = searchValue;
            this.replaceValue = replaceValue;
            _super.call(this, detailedLocation);
        }
        return ReplaceParams;
    })(RuleParamsBase);
    StringTransform.ReplaceParams = ReplaceParams;
    var RemoveParams = (function (_super) {
        __extends(RemoveParams, _super);
        function RemoveParams(detailedLocation, searchValue) {
            this.searchValue = searchValue;
            _super.call(this, detailedLocation);
        }
        return RemoveParams;
    })(RuleParamsBase);
    StringTransform.RemoveParams = RemoveParams;
    var InsertParams = (function (_super) {
        __extends(InsertParams, _super);
        function InsertParams(detailedLocation, insertValue) {
            this.insertValue = insertValue;
            _super.call(this, detailedLocation);
        }
        return InsertParams;
    })(RuleParamsBase);
    StringTransform.InsertParams = InsertParams;
    var StringRule = (function () {
        function StringRule(ruleType, ruleParams) {
            this.ruleType = ruleType;
            this.ruleParams = ruleParams;
        }
        StringRule.prototype.applyRemove = function (inputString) {
            var removeParams = this.ruleParams;
            switch (removeParams.detailedLocation.ruleLocation) {
                case 2 /* Global */:
                    return StringManip.applyRegEx(inputString, removeParams.searchValue, '', true, true);
                case 7 /* FirstOccurrence */:
                    return StringManip.applyRegEx(inputString, removeParams.searchValue, '', false, true);
                case 8 /* LastOccurrence */:
                    var stringLocations = StringManip.getStringIndexes(inputString, removeParams.searchValue);
                    if (stringLocations && stringLocations.length > 0) {
                        var lastOccurrence = stringLocations.slice(-1);
                        return StringManip.removeStrings(inputString, removeParams.searchValue, lastOccurrence);
                    }
            }
            return inputString;
        };
        StringRule.prototype.applyReplace = function (inputString) {
            var replaceParams = this.ruleParams;
            switch (replaceParams.detailedLocation.ruleLocation) {
                case 1 /* End */:
                    replaceParams.searchValue += '$';
                case 0 /* Start */:
                    return StringManip.applyRegEx(inputString, replaceParams.searchValue, replaceParams.replaceValue, false, true);
                case 2 /* Global */:
                    return StringManip.applyRegEx(inputString, replaceParams.searchValue, replaceParams.replaceValue, true, true);
            }
            return inputString;
        };
        StringRule.prototype.applyInsert = function (inputString) {
            var insertParams = this.ruleParams;
            var stringLocations;
            switch (insertParams.detailedLocation.ruleLocation) {
                case 0 /* Start */:
                    return insertParams.insertValue + inputString;
                case 1 /* End */:
                    return inputString + insertParams.insertValue;
                case 3 /* BeforeSpecifiedString */:
                    stringLocations = StringManip.getStringIndexes(inputString, insertParams.detailedLocation.beforeString);
                    return StringManip.insertBefore(inputString, insertParams.insertValue, stringLocations);
                case 4 /* AfterSpecifiedString */:
                    stringLocations = StringManip.getStringIndexes(inputString, insertParams.detailedLocation.afterString);
                    return StringManip.insertAfter(inputString, insertParams.insertValue, stringLocations);
                case 5 /* AtSpecificLocation */:
                    return StringManip.insertBefore(inputString, insertParams.insertValue, [insertParams.detailedLocation.specificLocationIndex]);
                case 6 /* OnNewLine */:
                    return LineHelper.insertNewLine(inputString, insertParams.insertValue, insertParams.detailedLocation.onNewLineAfterText);
            }
            return inputString;
        };
        StringRule.prototype.apply = function (inputString) {
            switch (this.ruleType) {
                case 0 /* Remove */:
                    return this.applyRemove(inputString);
                case 1 /* Replace */:
                    return this.applyReplace(inputString);
                case 2 /* Insert */:
                    return this.applyInsert(inputString);
            }
            return inputString;
        };
        return StringRule;
    })();
    StringTransform.StringRule = StringRule;
    var RuleSet = (function () {
        function RuleSet(stringRules) {
            if (stringRules === void 0) { stringRules = []; }
            this.stringRules = stringRules;
        }
        RuleSet.prototype.apply = function (inputString) {
            var lines = LineHelper.parseLines(inputString);
            var resultLines = [];
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
        };
        return RuleSet;
    })();
    StringTransform.RuleSet = RuleSet;
})(StringTransform || (StringTransform = {}));
var StringManip;
(function (StringManip) {
    function applyRegEx(intputString, pattern, replaceValue, isGlobal, ignoreCase, multiLine) {
        if (multiLine === void 0) { multiLine = true; }
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
    StringManip.applyRegEx = applyRegEx;
    function getStringIndexes(inputString, pattern) {
        var regex = new RegExp(pattern, 'gi');
        var result, indices = [];
        while ((result = regex.exec(inputString))) {
            indices.push(result.index);
        }
        return indices;
    }
    StringManip.getStringIndexes = getStringIndexes;
    function insertBefore(inputString, insertValue, locations) {
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
    StringManip.insertBefore = insertBefore;
    function insertAfter(inputString, insertValue, locations) {
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
    StringManip.insertAfter = insertAfter;
    function removeStrings(inputString, stringToRemove, locations) {
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
    StringManip.removeStrings = removeStrings;
})(StringManip || (StringManip = {}));
var LineHelper;
(function (LineHelper) {
    LineHelper.lineEnding = '\r\n';
    function parseLines(rawInput) {
        var lines = rawInput.split(LineHelper.lineEnding);
        return lines;
    }
    LineHelper.parseLines = parseLines;
    function removeLineBreak(line) {
        return StringManip.applyRegEx(line, LineHelper.lineEnding, '', true, true);
    }
    LineHelper.removeLineBreak = removeLineBreak;
    function insertNewLine(input, newLineText, afterLineWithText) {
        var lines = input.split(LineHelper.lineEnding);
        var resultLines = [];
        for (var i = 0; i < lines.length; i++) {
            var line = removeLineBreak(lines[i]);
            resultLines.push(line);
            if (line.indexOf(afterLineWithText, line.length - afterLineWithText.length) !== -1) {
                resultLines.push(newLineText);
            }
        }
        return resultLines.join(LineHelper.lineEnding);
    }
    LineHelper.insertNewLine = insertNewLine;
    function trimLines(input) {
        var lines = input.split(LineHelper.lineEnding);
        var resultLines = [];
        for (var i = 0; i < lines.length; i++) {
            var line = removeLineBreak(lines[i]);
            resultLines.push(line.trim());
        }
        return resultLines.join(LineHelper.lineEnding);
    }
    LineHelper.trimLines = trimLines;
})(LineHelper || (LineHelper = {}));
var WebApp;
(function (WebApp) {
    var transformInputId = 'transformInput';
    var transformButtonId = 'btnTransform';
    var InputResult = (function () {
        function InputResult(validated, params) {
            this.validated = validated;
            this.params = params;
        }
        return InputResult;
    })();
    WebApp.InputResult = InputResult;
    function parseInputs(ruleType) {
        var validated = false;
        var params;
        var detailedLocation = new StringTransform.DetailedLocation();
        switch (ruleType) {
            case 1 /* Replace */:
                var replaceView = new Views.ReplaceView();
                params = new StringTransform.ReplaceParams(detailedLocation, replaceView.getInputFieldValue(replaceView.replaceText), replaceView.getInputFieldValue(replaceView.replaceWithText));
                break;
            case 0 /* Remove */:
                var removeView = new Views.RemoveView();
                var removeRuleLocationText = removeView.getInputFieldValue(Views.RemoveView.removeRuleLocation);
                detailedLocation.ruleLocation = StringTransform.RuleLocation[removeRuleLocationText];
                params = new StringTransform.RemoveParams(detailedLocation, removeView.getInputFieldValue(removeView.removeText));
                break;
            case 2 /* Insert */:
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
    WebApp.parseInputs = parseInputs;
    function runTransformation() {
        var ruleTypeText = '';
        var ruleTypeAnchors = document.getElementsByClassName('ruleType');
        for (var i = 0; i < ruleTypeAnchors.length; i++) {
            var ruleTypeAnchor = ruleTypeAnchors[i];
            if (ruleTypeAnchor.classList.contains('active')) {
                ruleTypeText = ruleTypeAnchor.dataset['mangleRule'];
            }
        }
        var ruleType = StringTransform.RuleType[ruleTypeText];
        var inputResult = parseInputs(ruleType);
        if (!inputResult.validated) {
            return false;
        }
        var stringRule = new StringTransform.StringRule(ruleType, inputResult.params);
        var rules = [];
        rules.push(stringRule);
        var ruleSet = new StringTransform.RuleSet(rules);
        var transformInput = document.getElementById(transformInputId);
        var result = ruleSet.apply(transformInput.innerText);
        transformInput.innerText = result;
        return false;
    }
    WebApp.runTransformation = runTransformation;
    function insertRuleLocationChange() {
        var ruleLocationText = document.getElementById(Views.InsertView.insertRuleLocation).value;
        HtmlHelper.hideElementsByClassName('location-details');
        var locationClassName = 'location-' + ruleLocationText;
        HtmlHelper.displayElementsByClassName(locationClassName);
    }
    WebApp.insertRuleLocationChange = insertRuleLocationChange;
    function ruleTypeChange() {
        var ruleTypeAnchor = this;
        var ruleTypeItems = ruleTypeAnchor.parentNode.childNodes;
        for (var i = 0; i < ruleTypeItems.length; i++) {
            var childItem = ruleTypeItems[i];
            if (childItem && childItem.classList) {
                childItem.classList.remove('active');
            }
        }
        ruleTypeAnchor.classList.add('active');
        HtmlHelper.hideElementsByClassName('field-wrapper');
        var ruleTypeText = this.dataset.ruletype;
        var ruleType = StringTransform.RuleType[ruleTypeText];
        var className = 'ruleType-' + ruleTypeText;
        HtmlHelper.displayElementsByClassName(className);
        HtmlHelper.hideElementById(transformButtonId);
        switch (ruleType) {
            case 3 /* Other */:
                break;
            case 2 /* Insert */:
                HtmlHelper.displayElementsById(transformButtonId);
                insertRuleLocationChange();
                break;
            default:
                HtmlHelper.displayElementsById(transformButtonId);
                break;
        }
        return false;
    }
    WebApp.ruleTypeChange = ruleTypeChange;
    var Views;
    (function (Views) {
        (function (InputType) {
            InputType[InputType["Text"] = 0] = "Text";
            InputType[InputType["Number"] = 1] = "Number";
            InputType[InputType["TextArea"] = 2] = "TextArea";
            InputType[InputType["RuleLocationSelect"] = 3] = "RuleLocationSelect";
            InputType[InputType["RemoveLocationSelect"] = 4] = "RemoveLocationSelect";
            InputType[InputType["Button"] = 5] = "Button";
            InputType[InputType["Div"] = 6] = "Div";
        })(Views.InputType || (Views.InputType = {}));
        var InputType = Views.InputType;
        var BaseView = (function () {
            function BaseView(ruleType, inputFields) {
                if (inputFields === void 0) { inputFields = []; }
                this.ruleType = ruleType;
                this.inputFields = inputFields;
            }
            BaseView.prototype.appendToForm = function () {
                var rulesWrapper = document.getElementById('rules');
                for (var i = 0; i < this.inputFields.length; i++) {
                    rulesWrapper.appendChild(this.inputFields[i].render());
                }
            };
            BaseView.prototype.getInputFieldValue = function (id) {
                for (var i = 0; i < this.inputFields.length; i++) {
                    var inputField = this.inputFields[i];
                    if (inputField.id === id) {
                        return this.inputFields[i].getValue();
                    }
                }
                return '';
            };
            return BaseView;
        })();
        Views.BaseView = BaseView;
        var InputField = (function () {
            function InputField(ruleType, id, inputType, labelText, placeHolderText, additionalWrapperClasses, buttonText, buttonClickEvent, mangleRule) {
                if (labelText === void 0) { labelText = ''; }
                if (placeHolderText === void 0) { placeHolderText = ''; }
                if (additionalWrapperClasses === void 0) { additionalWrapperClasses = ''; }
                if (buttonText === void 0) { buttonText = ''; }
                if (buttonClickEvent === void 0) { buttonClickEvent = null; }
                if (mangleRule === void 0) { mangleRule = null; }
                this.ruleType = ruleType;
                this.id = id;
                this.inputType = inputType;
                this.labelText = labelText;
                this.placeHolderText = placeHolderText;
                this.additionalWrapperClasses = additionalWrapperClasses;
                this.buttonText = buttonText;
                this.buttonClickEvent = buttonClickEvent;
                this.mangleRule = mangleRule;
            }
            InputField.prototype.render = function () {
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
                    case 0 /* Text */:
                        var text = document.createElement('input');
                        text.className = 'form-control';
                        text.id = this.id;
                        text.type = 'text';
                        text.placeholder = this.placeHolderText;
                        fieldWrapper.appendChild(text);
                        break;
                    case 1 /* Number */:
                        var numberText = document.createElement('input');
                        numberText.className = 'form-control';
                        numberText.id = this.id;
                        numberText.type = 'number';
                        numberText.placeholder = this.placeHolderText;
                        fieldWrapper.appendChild(numberText);
                        break;
                    case 2 /* TextArea */:
                        var textArea = document.createElement('textarea');
                        textArea.className = 'form-control';
                        textArea.id = this.id;
                        textArea.placeholder = this.placeHolderText;
                        fieldWrapper.appendChild(textArea);
                        break;
                    case 3 /* RuleLocationSelect */:
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
                        optionStart.value = StringTransform.RuleLocation[0 /* Start */];
                        ruleLocationSelect.appendChild(optionStart);
                        var optionEnd = document.createElement('option');
                        optionEnd.innerText = 'End';
                        optionEnd.value = StringTransform.RuleLocation[1 /* End */];
                        ruleLocationSelect.appendChild(optionEnd);
                        var optionBeforeSpecText = document.createElement('option');
                        optionBeforeSpecText.innerText = 'Before Specific Text';
                        optionBeforeSpecText.value = StringTransform.RuleLocation[3 /* BeforeSpecifiedString */];
                        ruleLocationSelect.appendChild(optionBeforeSpecText);
                        var optionAfterSpecText = document.createElement('option');
                        optionAfterSpecText.innerText = 'After Specific Text';
                        optionAfterSpecText.value = StringTransform.RuleLocation[4 /* AfterSpecifiedString */];
                        ruleLocationSelect.appendChild(optionAfterSpecText);
                        var optionAtSpecLoc = document.createElement('option');
                        optionAtSpecLoc.innerText = 'At Specific Number Location';
                        optionAtSpecLoc.value = StringTransform.RuleLocation[5 /* AtSpecificLocation */];
                        ruleLocationSelect.appendChild(optionAtSpecLoc);
                        var optionOnNewLine = document.createElement('option');
                        optionOnNewLine.innerText = 'On A New Line';
                        optionOnNewLine.value = StringTransform.RuleLocation[6 /* OnNewLine */];
                        ruleLocationSelect.appendChild(optionOnNewLine);
                        fieldWrapper.appendChild(ruleLocationSelect);
                        break;
                    case 4 /* RemoveLocationSelect */:
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
                        removeOptionGlobal.value = StringTransform.RuleLocation[2 /* Global */];
                        removeLocationSelect.appendChild(removeOptionGlobal);
                        var removeOptionFirstOcc = document.createElement('option');
                        removeOptionFirstOcc.innerText = 'First Occurrence';
                        removeOptionFirstOcc.value = StringTransform.RuleLocation[7 /* FirstOccurrence */];
                        removeLocationSelect.appendChild(removeOptionFirstOcc);
                        var removeOptionLastOcc = document.createElement('option');
                        removeOptionLastOcc.innerText = 'Last Occurrence';
                        removeOptionLastOcc.value = StringTransform.RuleLocation[8 /* LastOccurrence */];
                        removeLocationSelect.appendChild(removeOptionLastOcc);
                        fieldWrapper.appendChild(removeLocationSelect);
                        break;
                    case 5 /* Button */:
                        var btn = document.createElement('button');
                        btn.id = this.id;
                        btn.innerText = this.buttonText;
                        btn.className = 'btn btn-info';
                        btn.onclick = this.buttonClickEvent;
                        btn.dataset['mangleRule'] = StringTransform.MangleRule[this.mangleRule];
                        fieldWrapper.appendChild(btn);
                        break;
                    case 6 /* Div */:
                        var div = document.createElement('div');
                        div.id = this.id;
                        fieldWrapper.appendChild(div);
                        break;
                }
                return fieldWrapper;
            };
            InputField.prototype.getValue = function () {
                switch (this.inputType) {
                    case 0 /* Text */:
                    case 1 /* Number */:
                        return document.getElementById(this.id).value;
                    case 2 /* TextArea */:
                        return document.getElementById(this.id).value;
                    case 3 /* RuleLocationSelect */:
                    case 4 /* RemoveLocationSelect */:
                        return document.getElementById(this.id).value;
                }
                return '';
            };
            return InputField;
        })();
        Views.InputField = InputField;
        var RemoveView = (function (_super) {
            __extends(RemoveView, _super);
            function RemoveView() {
                _super.call(this, 0 /* Remove */);
                this.removeText = 'removeText';
                var removeLocationSelect = new InputField(this.ruleType, RemoveView.removeRuleLocation, 4 /* RemoveLocationSelect */);
                this.inputFields.push(removeLocationSelect);
                var removeStringField = new InputField(this.ruleType, this.removeText, 2 /* TextArea */, '', 'Remove This Text');
                this.inputFields.push(removeStringField);
            }
            RemoveView.removeRuleLocation = 'removeRuleLocation';
            return RemoveView;
        })(BaseView);
        Views.RemoveView = RemoveView;
        var ReplaceView = (function (_super) {
            __extends(ReplaceView, _super);
            function ReplaceView() {
                _super.call(this, 1 /* Replace */);
                this.replaceText = 'replaceText';
                this.replaceWithText = 'replaceWithText';
                var replaceStringField = new InputField(this.ruleType, this.replaceText, 2 /* TextArea */, '', 'Replace This Text');
                this.inputFields.push(replaceStringField);
                var replaceWithStringField = new InputField(this.ruleType, this.replaceWithText, 2 /* TextArea */, '', 'With This Text');
                this.inputFields.push(replaceWithStringField);
            }
            return ReplaceView;
        })(BaseView);
        Views.ReplaceView = ReplaceView;
        var InsertView = (function (_super) {
            __extends(InsertView, _super);
            function InsertView() {
                _super.call(this, 2 /* Insert */);
                this.insertText = 'insertText';
                this.insertBeforeText = 'insertBeforeText';
                this.insertAfterText = 'insertAfterText';
                this.insertLocation = 'insertLocation';
                this.insertNewLinesAfterText = 'insertNewLinesAfterText';
                var insertStringField = new InputField(this.ruleType, this.insertText, 2 /* TextArea */, '', 'Insert This Text');
                this.inputFields.push(insertStringField);
                var ruleLocationSelect = new InputField(this.ruleType, InsertView.insertRuleLocation, 3 /* RuleLocationSelect */, '', 'Location:');
                this.inputFields.push(ruleLocationSelect);
                var classBase = 'hidden location-details location-';
                var classBefore = classBase + StringTransform.RuleLocation[3 /* BeforeSpecifiedString */];
                var insertBeforeString = new InputField(this.ruleType, this.insertBeforeText, 2 /* TextArea */, '', 'Insert Before This Text', classBefore);
                this.inputFields.push(insertBeforeString);
                var classAfter = classBase + StringTransform.RuleLocation[4 /* AfterSpecifiedString */];
                var insertAfterString = new InputField(this.ruleType, this.insertAfterText, 2 /* TextArea */, '', 'Insert After This Text', classAfter);
                this.inputFields.push(insertAfterString);
                var classAt = classBase + StringTransform.RuleLocation[5 /* AtSpecificLocation */];
                var insertAtLoc = new InputField(this.ruleType, this.insertLocation, 1 /* Number */, '', 'Insert At This Location', classAt);
                this.inputFields.push(insertAtLoc);
                var classOnNewLine = classBase + StringTransform.RuleLocation[6 /* OnNewLine */];
                var insertOnNewLine = new InputField(this.ruleType, this.insertNewLinesAfterText, 2 /* TextArea */, '', 'Insert After Lines That End With', classOnNewLine);
                this.inputFields.push(insertOnNewLine);
            }
            InsertView.insertRuleLocation = 'insertRuleLocation';
            return InsertView;
        })(BaseView);
        Views.InsertView = InsertView;
        var OtherView = (function (_super) {
            __extends(OtherView, _super);
            function OtherView() {
                _super.call(this, 3 /* Other */);
                var btnTrim = new InputField(this.ruleType, OtherView.trimLinesId, 5 /* Button */, '', '', '', 'Trim', QuickRules.runTrimLines);
                this.inputFields.push(btnTrim);
                var btnFormatJSON = new InputField(this.ruleType, OtherView.formatJSONId, 5 /* Button */, '', '', '', 'Format JSON', QuickRules.formatJSON);
                this.inputFields.push(btnFormatJSON);
            }
            OtherView.trimLinesId = 'btnTrimLines';
            OtherView.formatJSONId = 'btnFormatJSON';
            return OtherView;
        })(BaseView);
        Views.OtherView = OtherView;
        var MangleView = (function (_super) {
            __extends(MangleView, _super);
            function MangleView() {
                _super.call(this, 4 /* Mangle */);
                var btnStaticText = new InputField(this.ruleType, MangleView.btnStaticTextId, 5 /* Button */, '', '', '', 'Static Text', addMangleRule, 0 /* StaticText */);
                this.inputFields.push(btnStaticText);
                var btnSubString = new InputField(this.ruleType, MangleView.btnStaticTextId, 5 /* Button */, '', '', '', 'SubString', addMangleRule, 1 /* SubString */);
                this.inputFields.push(btnSubString);
                var mangleRuleWrapper = new InputField(this.ruleType, MangleView.mangleRulesWrapperId, 6 /* Div */);
                this.inputFields.push(mangleRuleWrapper);
            }
            MangleView.btnStaticTextId = 'btnMangleStaticText';
            MangleView.mangleRulesWrapperId = 'mangleRulesWrapper';
            return MangleView;
        })(BaseView);
        Views.MangleView = MangleView;
        function addMangleRule() {
            var btn = this;
            var mangleRule = StringTransform.MangleRule[btn.dataset['mangleRule']];
            var mangleRulesWrapper = document.getElementById(MangleView.mangleRulesWrapperId);
            var singleRuleWrapper = document.createElement('div');
            singleRuleWrapper.className = 'rule-wrapper';
            switch (mangleRule) {
                case 0 /* StaticText */:
                    var txtStaticText = document.createElement('input');
                    txtStaticText.type = 'text';
                    txtStaticText.placeholder = 'Static Text';
                    singleRuleWrapper.appendChild(txtStaticText);
                    break;
                case 1 /* SubString */:
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
        Views.addMangleRule = addMangleRule;
        function removeMangleRule() {
            var anchor = this;
            var singleRuleWrapper = anchor.parentNode;
            singleRuleWrapper.removeNode(true);
            return false;
        }
        Views.removeMangleRule = removeMangleRule;
    })(Views = WebApp.Views || (WebApp.Views = {}));
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
    function setup() {
        render();
        document.getElementById(transformButtonId).onclick = WebApp.runTransformation;
        document.getElementById(Views.InsertView.insertRuleLocation).onchange = WebApp.insertRuleLocationChange;
        var ruleTypeItems = document.getElementsByClassName('ruleType');
        for (var i = 0; i < ruleTypeItems.length; i++) {
            ruleTypeItems[i].onclick = WebApp.ruleTypeChange;
        }
    }
    WebApp.setup = setup;
    var QuickRules;
    (function (QuickRules) {
        function runTrimLines() {
            var transformInput = document.getElementById(transformInputId);
            transformInput.innerText = LineHelper.trimLines(transformInput.innerText);
            return false;
        }
        QuickRules.runTrimLines = runTrimLines;
        function formatJSON() {
            var transformInput = document.getElementById(transformInputId);
            var obj = JSON.parse(transformInput.innerText);
            transformInput.innerText = JSON.stringify(obj, null, 2);
            return false;
        }
        QuickRules.formatJSON = formatJSON;
    })(QuickRules = WebApp.QuickRules || (WebApp.QuickRules = {}));
    var HtmlHelper;
    (function (HtmlHelper) {
        var hiddenClass = 'hidden';
        function hideElementById(id) {
            var element = document.getElementById(id);
            element.classList.add(hiddenClass);
        }
        HtmlHelper.hideElementById = hideElementById;
        function displayElementsById(id) {
            var element = document.getElementById(id);
            element.classList.remove(hiddenClass);
        }
        HtmlHelper.displayElementsById = displayElementsById;
        function hideElementsByClassName(className) {
            var locationDetailInputs = document.getElementsByClassName(className);
            for (var i = 0; i < locationDetailInputs.length; i++) {
                var input = locationDetailInputs[i];
                input.classList.add(hiddenClass);
            }
        }
        HtmlHelper.hideElementsByClassName = hideElementsByClassName;
        function displayElementsByClassName(className) {
            var locationDetailInputs = document.getElementsByClassName(className);
            for (var i = 0; i < locationDetailInputs.length; i++) {
                var input = locationDetailInputs[i];
                input.classList.remove(hiddenClass);
            }
        }
        HtmlHelper.displayElementsByClassName = displayElementsByClassName;
        function getSelectedValueByName(name) {
            var ruleTypeRadios = document.getElementsByName(name);
            for (var i = 0; i < ruleTypeRadios.length; i++) {
                var ruleTypeRadio = ruleTypeRadios[i];
                if (ruleTypeRadio.checked) {
                    return ruleTypeRadio.value;
                }
            }
            return '';
        }
        HtmlHelper.getSelectedValueByName = getSelectedValueByName;
    })(HtmlHelper || (HtmlHelper = {}));
})(WebApp || (WebApp = {}));
window.onload = function () {
    WebApp.setup();
};
//# sourceMappingURL=app.js.map