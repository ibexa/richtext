import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';

import IbexaCustomAttributesFormView from './ui/custom-attributes-form-view';
import IbexaButtonView from '../common/button-view/button-view';
import { setPanelContentMaxHeight } from '../helpers/custom-panel-helper';

import { getCustomAttributesElementConfig, getCustomClassesElementConfig } from './helpers/config-helper';

const { Translator } = window;

class IbexaAttributesUI extends Plugin {
    constructor(props) {
        super(props);

        this.balloon = this.editor.plugins.get('ContextualBalloon');
        this.formView = this.createFormView();

        this.showForm = this.showForm.bind(this);

        let timeoutId = null;

        this.listenTo(this.balloon.view, 'change:top', () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setPanelContentMaxHeight(this.balloon.view);
            }, 0);
        });
    }

    getModelElement() {
        return this.editor.model.document.selection.getSelectedElement() || this.editor.model.document.selection.anchor.parent;
    }

    getAttributePrefix() {
        return this.editor.isListSelected ? 'list-' : '';
    }

    createFormView() {
        const formView = new IbexaCustomAttributesFormView({ locale: this.editor.locale });

        this.listenTo(formView, 'save-custom-attributes', () => {
            const values = this.formView.getValues();
            const modelElements = this.editor.isListSelected
                ? Array.from(this.editor.model.document.selection.getSelectedBlocks())
                : [this.getModelElement()];

            this.editor.model.change((writer) => {
                Object.entries(values).forEach(([name, value]) => {
                    const prefix = this.getAttributePrefix();

                    modelElements.forEach((modelElement) => {
                        if (this.editor.isListSelected && this.editor.listIndent !== modelElement.getAttribute('listIndent')) {
                            return;
                        }

                        writer.setAttribute(`${prefix}${name}`, value, modelElement);
                    });
                });
            });

            this.hideForm();
        });

        this.listenTo(formView, 'remove-custom-attributes', () => {
            const values = this.formView.getValues();
            const modelElements = this.editor.isListSelected
                ? Array.from(this.editor.model.document.selection.getSelectedBlocks())
                : [this.getModelElement()];

            this.editor.model.change((writer) => {
                Object.keys(values).forEach((name) => {
                    const prefix = this.getAttributePrefix();

                    modelElements.forEach((modelElement) => {
                        if (this.editor.isListSelected && this.editor.listIndent !== modelElement.getAttribute('listIndent')) {
                            return;
                        }

                        writer.removeAttribute(`${prefix}${name}`, modelElement);
                    });
                });
            });

            this.hideForm();
        });

        this.listenTo(formView, 'revert-custom-attributes', () => {
            this.hideForm();
        });

        return formView;
    }

    hideForm() {
        this.balloon.remove(this.formView);
        this.editor.editing.view.focus();
    }

    showForm() {
        const parentElement = this.getModelElement();
        const prefix = this.getAttributePrefix();
        let parentElementName = parentElement.name;

        if (this.editor.isListSelected) {
            const mapping = {
                bulleted: 'ul',
                numbered: 'ol',
            };
            const listType = parentElement.getAttribute('listType');

            if (mapping[listType]) {
                parentElementName = mapping[listType];
            }
        }

        const customAttributes = getCustomAttributesElementConfig(parentElementName) ?? {};
        const customClasses = getCustomClassesElementConfig(parentElementName);
        const areCustomAttributesSet =
            parentElement.hasAttribute(`${prefix}custom-classes`) ||
            Object.keys(customAttributes).some((customAttributeName) => parentElement.hasAttribute(`${prefix}${customAttributeName}`));
        const attributesValues = Object.entries(customAttributes).reduce((output, [name, config]) => {
            output[name] = areCustomAttributesSet ? parentElement.getAttribute(`${prefix}${name}`) : config.defaultValue;

            return output;
        }, {});
        const defaultCustomClasses = customClasses?.defaultValue ?? '';
        const classesValue = areCustomAttributesSet ? parentElement.getAttribute(`${prefix}custom-classes`) : defaultCustomClasses;

        this.formView.destroy();
        this.formView = this.createFormView();

        this.formView.setChildren(customAttributes, customClasses);
        this.formView.setValues(attributesValues, classesValue);

        this.balloon.view.on('change:isVisible', () => {
            this.formView.fire('ibexa-ckeditor:custom-attributes:recalculate-chips');
        });

        this.balloon.add({
            view: this.formView,
            position: this.getBalloonPositionData(),
        });

        this.balloon.updatePosition(this.getBalloonPositionData());
    }

    getBalloonPositionData() {
        const { view } = this.editor.editing;
        const viewDocument = view.document;
        const range = viewDocument.selection.getFirstRange();

        return { target: view.domConverter.viewRangeToDom(range) };
    }

    init() {
        this.editor.ui.componentFactory.add('ibexaCustomAttributes', (locale) => {
            const buttonView = new IbexaButtonView(locale);
            const command = this.editor.commands.get('insertIbexaCustomAttributes');

            buttonView.set({
                label: Translator.trans(/*@Desc("Custom attributes")*/ 'custom_attributes_btn.label', {}, 'ck_editor'),
                icon: window.ibexa.helpers.icon.getIconPath('edit'),
                tooltip: true,
            });

            buttonView.bind('isEnabled').to(command);

            this.listenTo(buttonView, 'execute', this.showForm);

            return buttonView;
        });

        clickOutsideHandler({
            emitter: this.formView,
            activator: () => this.balloon.hasView(this.formView),
            contextElements: [this.balloon.view.element],
            callback: () => this.hideForm(),
        });
    }
}

export default IbexaAttributesUI;
