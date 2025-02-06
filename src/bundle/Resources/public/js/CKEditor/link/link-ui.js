import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import clickOutsideHandler from '@ckeditor/ckeditor5-ui/src/bindings/clickoutsidehandler';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
import findAttributeRange from '@ckeditor/ckeditor5-typing/src/utils/findattributerange';

import IbexaLinkFormView from './ui/link-form-view';
import IbexaButtonView from '../common/button-view/button-view';
import { getCustomAttributesConfig, getCustomClassesConfig } from '../custom-attributes/helpers/config-helper';
import { encodeUrlQuery } from '../helpers/url-helper';

const { Translator } = window;

class IbexaLinkUI extends Plugin {
    constructor(props) {
        super(props);

        this.balloon = this.editor.plugins.get('ContextualBalloon');
        this.formView = this.createFormView();

        this.showForm = this.showForm.bind(this);
        this.addLink = this.addLink.bind(this);
        this.getLinkRange = this.getLinkRange.bind(this);

        this.isNew = false;
    }

    getLinkRange() {
        return findAttributeRange(
            this.editor.model.document.selection.getFirstPosition(),
            'ibexaLinkHref',
            this.editor.model.document.selection.getAttribute('ibexaLinkHref'),
            this.editor.model,
        );
    }

    createFormView() {
        const formView = new IbexaLinkFormView({ locale: this.editor.locale, editor: this.editor });

        this.listenTo(formView, 'save-link', () => {
            const { url, title, target, ibexaLinkClasses, ibexaLinkAttributes } = this.formView.getValues();
            const { path: firstPosition } = this.editor.model.document.selection.getFirstPosition();
            const { path: lastPosition } = this.editor.model.document.selection.getLastPosition();
            const noRangeSelection = firstPosition[0] === lastPosition[0] && firstPosition[1] === lastPosition[1];

            const isValueValid = this.isValueValid(url);

            if (!isValueValid) {
                this.formView.setError(Translator.trans(/*@Desc("A valid link is needed.")*/ 'link_btn.error.valid', {}, 'ck_editor'));

                return;
            }

            if (noRangeSelection) {
                const range = this.getLinkRange();

                this.editor.model.change((writer) => {
                    writer.setSelection(range);
                });
            }

            this.isNew = false;

            this.editor.execute('insertIbexaLink', { href: encodeUrlQuery(url), title, target, ibexaLinkClasses, ibexaLinkAttributes });
            this.hideForm();
        });

        this.listenTo(formView, 'remove-link', () => {
            this.removeLink();
            this.hideForm();
        });

        return formView;
    }

    removeAttributes(writer, element) {
        const { link: customAttributesLinkConfig } = getCustomAttributesConfig();
        const { link: customClassesLinkConfig } = getCustomClassesConfig();

        writer.removeAttribute('ibexaLinkHref', element);
        writer.removeAttribute('ibexaLinkTitle', element);
        writer.removeAttribute('ibexaLinkTarget', element);

        if (customClassesLinkConfig) {
            writer.removeAttribute('ibexaLinkClasses', element);
        }

        if (customAttributesLinkConfig) {
            const attributes = Object.keys(customAttributesLinkConfig);

            attributes.forEach((attribute) => {
                writer.removeAttribute(`ibexaLink${attribute}`, element);
            });
        }
    }

    removeLink() {
        const modelElement = this.editor.model.document.selection.getSelectedElement();
        const range = this.getLinkRange();

        if (modelElement) {
            if (this.editor.model.schema.checkAttribute(modelElement, 'ibexaLinkHref')) {
                this.editor.model.change((writer) => {
                    this.removeAttributes(writer, modelElement);
                });
            }
        } else {
            this.editor.model.change((writer) => {
                this.removeAttributes(writer, range);

                writer.setSelection(range);
            });
        }
    }

    showForm() {
        const customAttributesConfig = getCustomAttributesConfig();
        const customClassesConfig = getCustomClassesConfig();
        const customAttributesLinkConfig = customAttributesConfig.link;
        const customClassesLinkConfig = customClassesConfig.link;
        const link = this.findLinkElement();
        const values = {
            url: link ? link.getAttribute('href') : '',
            title: link ? link.getAttribute('title') : '',
            target: link ? link.getAttribute('target') : '',
        };

        if (customClassesLinkConfig) {
            const defaultCustomClasses = this.isNew ? customClassesLinkConfig.defaultValue : '';
            const classesValue = link?.getAttribute('class') ?? defaultCustomClasses;

            values.ibexaLinkClasses = classesValue;
        }

        if (customAttributesLinkConfig) {
            const attributesValues = Object.entries(customAttributesLinkConfig).reduce((output, [name, config]) => {
                const defaultCustomAttributeValue = this.isNew ? config.defaultValue : '';

                output[name] = link?.getAttribute(`data-ezattribute-${name}`) ?? defaultCustomAttributeValue;

                return output;
            }, {});

            values.ibexaLinkAttributes = attributesValues;
        }

        this.formView.setValues(values);

        this.balloon.add({
            view: this.formView,
            position: this.getBalloonPositionData(),
        });

        this.balloon.updatePosition(this.getBalloonPositionData());
    }

    hideForm() {
        if (this.isNew) {
            this.editor.model.change((writer) => {
                const ranges = this.editor.model.schema.getValidRanges(this.editor.model.document.selection.getRanges(), 'ibexaLinkHref');

                for (const range of ranges) {
                    this.removeAttributes(writer, range);
                }
            });
        }

        this.balloon.remove(this.formView);
        this.editor.editing.view.focus();
    }

    addLink() {
        this.editor.focus();
        this.editor.execute('insertIbexaLink', { href: '', title: '', target: '' });

        this.isNew = true;

        this.showForm();
    }

    getBalloonPositionData() {
        const { view } = this.editor.editing;
        const viewDocument = view.document;
        const range = viewDocument.selection.getFirstRange();

        return { target: view.domConverter.viewRangeToDom(range) };
    }

    enableUserBalloonInteractions() {
        const viewDocument = this.editor.editing.view.document;

        this.listenTo(viewDocument, 'click', () => {
            if (this.isLinkSelected()) {
                this.showForm();
            }
        });

        clickOutsideHandler({
            emitter: this.formView,
            activator: () => this.balloon.hasView(this.formView),
            contextElements: [this.balloon.view.element, document.querySelector('#react-udw')],
            callback: () => this.hideForm(),
        });
    }

    findLinkElement() {
        const position = this.editor.editing.view.document.selection.getFirstPosition();
        const ancestors = position.getAncestors();
        const link = ancestors.find((ancestor) => ancestor.is('attributeElement') && !!ancestor.hasAttribute('href'));

        return link;
    }

    isLinkSelected() {
        return !!this.findLinkElement();
    }

    isValueValid(url) {
        return typeof url !== 'undefined' && url !== '';
    }

    init() {
        this.editor.ui.componentFactory.add('ibexaLink', (locale) => {
            const buttonView = new IbexaButtonView(locale);
            const insertIbexaLinkCommand = this.editor.commands.get('insertIbexaLink');

            buttonView.set({
                label: Translator.trans(/*@Desc("Link")*/ 'link_btn.label', {}, 'ck_editor'),
                icon: window.ibexa.helpers.icon.getIconPath('link'),
                tooltip: true,
            });

            buttonView.bind('isEnabled').to(insertIbexaLinkCommand);

            this.listenTo(buttonView, 'execute', this.addLink);

            return buttonView;
        });

        this.editor.editing.view.addObserver(ClickObserver);

        this.enableUserBalloonInteractions();
    }
}

export default IbexaLinkUI;
