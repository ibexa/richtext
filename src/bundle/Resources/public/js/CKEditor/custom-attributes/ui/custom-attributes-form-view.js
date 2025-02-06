import View from '@ckeditor/ckeditor5-ui/src/view';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import LabeledFieldView from '@ckeditor/ckeditor5-ui/src/labeledfield/labeledfieldview';

import Model from '@ckeditor/ckeditor5-ui/src/model';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import { createLabeledInputText, createLabeledDropdown } from '@ckeditor/ckeditor5-ui/src/labeledfield/utils';
import { addListToDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import { getTranslator } from '@ibexa-admin-ui/src/bundle/Resources/public/js/scripts/helpers/context.helper';

import { createLabeledInputNumber } from '../../common/input-number/utils';
import { createLabeledSwitchButton } from '../../common/switch-button/utils';
import { addMultivalueSupport } from '../../common/multivalue-dropdown/utils';

class IbexaCustomAttributesFormView extends View {
    constructor(props) {
        super(props);

        this.locale = props.locale;

        this.saveButtonView = this.createButton('Save', null, 'ck-button-save', 'save-custom-attributes');
        this.cancelButtonView = this.createButton('Remove', null, 'ck-button-cancel', 'remove-custom-attributes');
        this.revertButtonView = this.createButton('Revert to saved', null, 'ck-button-revert', 'revert-custom-attributes');

        this.attributeViews = {};
        this.classesView = null;
        this.attributeRenderMethods = {
            string: this.createTextInput,
            number: this.createNumberInput,
            choice: this.createDropdown,
            boolean: this.createBoolean,
        };
        this.setValueMethods = {
            string: this.setStringValue,
            number: this.setNumberValue,
            choice: this.setChoiceValue,
            boolean: this.setBooleanValue,
        };
    }

    setChildren(customAttributes, customClasses) {
        this.customAttributes = customAttributes;
        this.customClasses = customClasses;
        this.children = this.createFormChildren(customAttributes, customClasses);

        this.setTemplate({
            tag: 'div',
            attributes: {
                class: 'ibexa-ckeditor-balloon-form ibexa-custom-panel',
            },
            children: [
                {
                    tag: 'div',
                    attributes: {
                        class: 'ibexa-ckeditor-balloon-form__header ibexa-custom-panel__header',
                    },
                    children: ['Custom Attributes'],
                },
                {
                    tag: 'form',
                    attributes: {
                        tabindex: '-1',
                    },
                    children: [
                        {
                            tag: 'div',
                            attributes: {
                                class: 'ibexa-ckeditor-balloon-form__fields ibexa-custom-panel__content ibexa-custom-panel__content--overflow-with-scroll',
                            },
                            children: this.children,
                        },
                        {
                            tag: 'div',
                            attributes: {
                                class: 'ibexa-ckeditor-balloon-form__actions ibexa-custom-panel__footer',
                            },
                            children: [this.saveButtonView, this.revertButtonView, this.cancelButtonView],
                        },
                    ],
                },
            ],
        });
    }

    setValues(attributesValues, classesValue) {
        if (classesValue && this.classesView) {
            this.setChoiceValue(this.classesView, classesValue);
        }

        Object.entries(attributesValues).forEach(([name, value]) => {
            const attributeView = this.attributeViews[name];
            const setValueMethod = this.setValueMethods[this.customAttributes[name].type];

            if (!attributeView || !setValueMethod) {
                return;
            }

            setValueMethod(attributeView, value);
        });
    }

    getValues() {
        return Object.entries(this.attributeViews).reduce(
            (output, [name, view]) => {
                output[name] = view.fieldView.element.value;

                return output;
            },
            { 'custom-classes': this.classesView?.fieldView.element.value ?? '' },
        );
    }

    setNumberValue(attributeView, value) {
        attributeView.fieldView.element.value = value;
        attributeView.fieldView.set('value', value);
        attributeView.fieldView.set('isEmpty', value !== 0 && !value);
    }

    setStringValue(attributeView, value) {
        attributeView.fieldView.element.value = value;
        attributeView.fieldView.set('value', value);
        attributeView.fieldView.set('isEmpty', !value);
    }

    setChoiceValue(attributeView, value) {
        attributeView.fieldView.element.value = value;
        attributeView.fieldView.buttonView.set({
            label: value,
            withText: true,
        });
        attributeView.set('isEmpty', !value);
    }

    setBooleanValue(attributeView, value) {
        attributeView.fieldView.isOn = value === 'true';
        attributeView.fieldView.element.value = value;
        attributeView.fieldView.set('value', value);
        attributeView.fieldView.set('isEmpty', false);
    }

    createFormChildren(customAttributes, customClasses) {
        const children = this.createCollection();

        if (customClasses && Object.keys(customClasses).length !== 0) {
            const classesView = this.createDropdown(customClasses);

            this.classesView = classesView;

            children.add(classesView);
        }

        if (customAttributes) {
            Object.entries(customAttributes).forEach(([name, config]) => {
                const createAttributeMethod = this.attributeRenderMethods[config.type];

                if (!createAttributeMethod) {
                    return;
                }

                const createAttribute = createAttributeMethod.bind(this);
                const attributeView = createAttribute(config);

                this.attributeViews[name] = attributeView;

                children.add(attributeView);
            });
        }

        return children;
    }

    createButton(label, icon, className, eventName) {
        const button = new ButtonView(this.locale);

        button.set({
            label,
            icon,
            tooltip: true,
            withText: true,
        });

        button.extendTemplate({
            attributes: {
                class: className,
            },
        });

        if (eventName) {
            button.delegate('execute').to(this, eventName);
        }

        return button;
    }

    createDropdown(config) {
        const Translator = getTranslator();
        const labeledDropdown = new LabeledFieldView(this.locale, createLabeledDropdown);
        const itemsList = new Collection();

        labeledDropdown.label = config.label;

        if (!config.multiple && !config.required) {
            itemsList.add({
                type: 'button',
                model: new Model({
                    withText: true,
                    label: Translator.trans(/*@Desc("None")*/ 'dropdown.none.label', {}, 'ck_editor'),
                    value: null,
                }),
            });
        }

        config.choices.forEach((choice) => {
            itemsList.add({
                type: config.multiple ? 'switchbutton' : 'button',
                model: new Model({
                    withText: true,
                    label: choice,
                    value: choice,
                }),
            });
        });

        addListToDropdown(labeledDropdown.fieldView, itemsList);

        if (config.multiple) {
            addMultivalueSupport(labeledDropdown, config, this);
        }

        this.listenTo(labeledDropdown.fieldView, 'execute', (event) => {
            const dropdownValue = labeledDropdown.fieldView.element.value ?? '';
            const value = this.getNewValue(event.source.value, config.multiple, dropdownValue);

            if (config.multiple) {
                const isSelected = value.length > dropdownValue.length;

                event.source.children.get(0).element.checked = isSelected;
            }

            labeledDropdown.fieldView.buttonView.set({
                label: value,
                withText: true,
            });

            labeledDropdown.fieldView.element.value = value;

            labeledDropdown.set('isEmpty', !event.source.value);
        });

        return labeledDropdown;
    }

    getNewValue(clickedValue, multiple, previousValue = '') {
        const selectedItems = previousValue ? new Set(previousValue.split(' ')) : new Set();

        if (selectedItems.has(clickedValue)) {
            selectedItems.delete(clickedValue);

            return [...selectedItems].join(' ');
        }

        if (!multiple) {
            selectedItems.clear();
        }

        selectedItems.add(clickedValue);

        return [...selectedItems].join(' ');
    }

    createTextInput(config) {
        const labeledInput = new LabeledFieldView(this.locale, createLabeledInputText);

        labeledInput.label = config.label;

        return labeledInput;
    }

    createNumberInput(config) {
        const labeledInput = new LabeledFieldView(this.locale, createLabeledInputNumber);

        labeledInput.label = config.label;

        return labeledInput;
    }

    createBoolean(config) {
        const labeledSwitch = new LabeledFieldView(this.locale, createLabeledSwitchButton);

        this.listenTo(labeledSwitch.fieldView, 'execute', () => {
            const value = !labeledSwitch.fieldView.isOn;

            labeledSwitch.fieldView.element.value = value;
            labeledSwitch.fieldView.set('value', value);
            labeledSwitch.fieldView.isOn = value;
        });

        labeledSwitch.label = config.label;

        return labeledSwitch;
    }
}

export default IbexaCustomAttributesFormView;
