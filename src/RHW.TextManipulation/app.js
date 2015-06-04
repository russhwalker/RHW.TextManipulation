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
var HtmlHelper;
(function (HtmlHelper) {
    function hideElementsByClassName(className) {
        var locationDetailInputs = document.getElementsByClassName(className);
        for (var i = 0; i < locationDetailInputs.length; i++) {
            var input = locationDetailInputs[i];
            input.classList.add('hidden');
        }
    }
    HtmlHelper.hideElementsByClassName = hideElementsByClassName;
    function showElementsByClassName(className) {
        var locationDetailInputs = document.getElementsByClassName(className);
        for (var i = 0; i < locationDetailInputs.length; i++) {
            var input = locationDetailInputs[i];
            input.classList.remove('hidden');
        }
    }
    HtmlHelper.showElementsByClassName = showElementsByClassName;
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
var WebApp;
(function (WebApp) {
    var transformInputId = 'transformInput';
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
        var ruleTypeText = HtmlHelper.getSelectedValueByName('ruleType');
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
        HtmlHelper.showElementsByClassName(locationClassName);
    }
    WebApp.insertRuleLocationChange = insertRuleLocationChange;
    function ruleTypeChange() {
        HtmlHelper.hideElementsByClassName('field-wrapper');
        var ruleTypeText = HtmlHelper.getSelectedValueByName('ruleType');
        var ruleType = StringTransform.RuleType[ruleTypeText];
        var className = 'ruleType-' + ruleTypeText;
        HtmlHelper.showElementsByClassName(className);
        switch (ruleType) {
            case 2 /* Insert */:
                insertRuleLocationChange();
                break;
        }
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
        })(Views.InputType || (Views.InputType = {}));
        var InputType = Views.InputType;
        var BaseView = (function () {
            function BaseView(ruleType, inputFields) {
                if (inputFields === void 0) { inputFields = []; }
                this.ruleType = ruleType;
                this.inputFields = inputFields;
            }
            BaseView.prototype.appendToForm = function () {
                var form = document.getElementById('rules');
                for (var i = 0; i < this.inputFields.length; i++) {
                    form.appendChild(this.inputFields[i].render());
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
            function InputField(ruleType, id, labelText, inputType, additionalWrapperClasses) {
                if (additionalWrapperClasses === void 0) { additionalWrapperClasses = ''; }
                this.ruleType = ruleType;
                this.id = id;
                this.labelText = labelText;
                this.inputType = inputType;
                this.additionalWrapperClasses = additionalWrapperClasses;
            }
            InputField.prototype.render = function () {
                var fieldWrapper = document.createElement('div');
                var ruleTypeText = StringTransform.RuleType[this.ruleType];
                fieldWrapper.className = 'hidden field-wrapper ruleType-' + ruleTypeText + ' ' + this.additionalWrapperClasses;
                var label = document.createElement('label');
                label.htmlFor = this.id;
                label.innerText = this.labelText;
                fieldWrapper.appendChild(label);
                switch (this.inputType) {
                    case 0 /* Text */:
                        var text = document.createElement('input');
                        text.className = 'form-control';
                        text.id = this.id;
                        text.type = 'text';
                        fieldWrapper.appendChild(text);
                        break;
                    case 1 /* Number */:
                        var numberText = document.createElement('input');
                        numberText.className = 'form-control';
                        numberText.id = this.id;
                        numberText.type = 'number';
                        fieldWrapper.appendChild(numberText);
                        break;
                    case 2 /* TextArea */:
                        var textArea = document.createElement('textarea');
                        textArea.className = 'form-control';
                        textArea.id = this.id;
                        fieldWrapper.appendChild(textArea);
                        break;
                    case 3 /* RuleLocationSelect */:
                        var ruleLocationSelect = document.createElement('select');
                        ruleLocationSelect.className = 'form-control';
                        ruleLocationSelect.id = this.id;
                        var defaultOption = document.createElement('option');
                        defaultOption.innerText = '--Select--';
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
                        defaultRemoveOption.innerText = 'Anywhere/Global';
                        defaultRemoveOption.value = StringTransform.RuleLocation[2 /* Global */];
                        defaultRemoveOption.selected = true;
                        removeLocationSelect.appendChild(defaultRemoveOption);
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
                var removeLocationSelect = new InputField(this.ruleType, RemoveView.removeRuleLocation, 'Location:', 4 /* RemoveLocationSelect */);
                this.inputFields.push(removeLocationSelect);
                var removeStringField = new InputField(this.ruleType, this.removeText, 'Remove This Text:', 2 /* TextArea */);
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
                var replaceStringField = new InputField(this.ruleType, this.replaceText, 'Replace This Text:', 2 /* TextArea */);
                this.inputFields.push(replaceStringField);
                var replaceWithStringField = new InputField(this.ruleType, this.replaceWithText, 'Replace With:', 2 /* TextArea */);
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
                var insertStringField = new InputField(this.ruleType, this.insertText, 'Insert This Text:', 2 /* TextArea */);
                this.inputFields.push(insertStringField);
                var ruleLocationSelect = new InputField(this.ruleType, InsertView.insertRuleLocation, 'Location:', 3 /* RuleLocationSelect */);
                this.inputFields.push(ruleLocationSelect);
                var classBase = 'hidden location-details location-';
                var classBefore = classBase + StringTransform.RuleLocation[3 /* BeforeSpecifiedString */];
                var insertBeforeString = new InputField(this.ruleType, this.insertBeforeText, 'Insert Before This Text:', 2 /* TextArea */, classBefore);
                this.inputFields.push(insertBeforeString);
                var classAfter = classBase + StringTransform.RuleLocation[4 /* AfterSpecifiedString */];
                var insertAfterString = new InputField(this.ruleType, this.insertAfterText, 'Insert After This Text:', 2 /* TextArea */, classAfter);
                this.inputFields.push(insertAfterString);
                var classAt = classBase + StringTransform.RuleLocation[5 /* AtSpecificLocation */];
                var insertAtLoc = new InputField(this.ruleType, this.insertLocation, 'Insert At This Location:', 1 /* Number */, classAt);
                this.inputFields.push(insertAtLoc);
                var classOnNewLine = classBase + StringTransform.RuleLocation[6 /* OnNewLine */];
                var insertOnNewLine = new InputField(this.ruleType, this.insertNewLinesAfterText, 'Insert After Lines That End With:', 2 /* TextArea */, classOnNewLine);
                this.inputFields.push(insertOnNewLine);
            }
            InsertView.insertRuleLocation = 'insertRuleLocation';
            return InsertView;
        })(BaseView);
        Views.InsertView = InsertView;
    })(Views = WebApp.Views || (WebApp.Views = {}));
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
    function render() {
        var removeView = new Views.RemoveView();
        removeView.appendToForm();
        var replaceView = new Views.ReplaceView();
        replaceView.appendToForm();
        var insertView = new Views.InsertView();
        insertView.appendToForm();
    }
    function setup() {
        render();
        document.getElementById('btnTrimLines').onclick = QuickRules.runTrimLines;
        document.getElementById('btnFormatJSON').onclick = QuickRules.formatJSON;
        document.getElementById(Views.InsertView.insertRuleLocation).onchange = WebApp.insertRuleLocationChange;
        var ruleTypeRadios = document.getElementsByName('ruleType');
        for (var i = 0; i < ruleTypeRadios.length; i++) {
            ruleTypeRadios[i].onclick = WebApp.ruleTypeChange;
        }
    }
    WebApp.setup = setup;
})(WebApp || (WebApp = {}));
window.onload = function () {
    WebApp.setup();
};
//# sourceMappingURL=app.js.map