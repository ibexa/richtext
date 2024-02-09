import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';

import IbexaEmbedContentInlineCommand from './embed-inline-command';

import { findContent } from '../../services/content-service';

const renderPreview = (title, contentId, itemActionsContainer) => {
    const itemActionsHTML = itemActionsContainer.outerHTML;

    return `<svg class="ibexa-icon ibexa-icon--medium ibexa-icon--secondary">
                <use xlink:href="${window.ibexa.helpers.icon.getIconPath('embed')}"></use>
            </svg>
            <span
                class="ibexa-embed-content__title"
                data-ibexa-update-content-id="${contentId}"
                data-ibexa-update-source-data-path="Content.Name"
            >
                ${title}
            </span>
            <span>
                <button
                    type="button"
                    class="btn ibexa-btn ibexa-btn--small ibexa-btn--ghost ibexa-btn--no-text ibexa-embedded-item__actions-menu-trigger-btn"
                >
                    <svg class="ibexa-icon ibexa-icon--small ibexa-icon--secondary">
                        <use xlink:href="${window.ibexa.helpers.icon.getIconPath('options')}"></use>
                    </svg>
                </button>
            </span>
            ${itemActionsHTML}`;
};

class IbexaEmbedContentInlineEditing extends Plugin {
    static get requires() {
        return [Widget];
    }

    defineSchema() {
        const { schema } = this.editor.model;

        schema.register('embedInline', {
            isObject: true,
            isInline: true,
            allowWhere: '$text',
            allowAttributes: ['contentId', 'contentName', 'locationId', 'languageCodes'],
        });
    }

    defineConverters() {
        const { conversion } = this.editor;

        conversion
            .for('editingDowncast')
            .elementToElement({
                model: 'embedInline',
                view: (modelElement, { writer: downcastWriter }) => {
                    const { editor } = this;
                    const container = downcastWriter.createContainerElement('span', {
                        'data-ezelement': 'ezembedinline',
                        'data-ezview': 'embed-inline',
                        class: 'ibexa-embed-inline',
                    });
                    const preview = downcastWriter.createUIElement('span', { class: 'ibexa-embed-content' }, function (domDocument) {
                        const domElement = this.toDomElement(domDocument);
                        const itemActionsContainer = editor.sourceElement.parentNode.querySelector('.ibexa-embedded-item-actions');

                        domElement.innerHTML = renderPreview(modelElement.getAttribute('contentName'), null, itemActionsContainer);

                        return domElement;
                    });

                    downcastWriter.insert(downcastWriter.createPositionAt(container, 0), preview);

                    return toWidget(container, downcastWriter);
                },
            })
            .add((dispatcher) =>
                dispatcher.on('attribute:contentName:embedInline', (event, data, conversionApi) => {
                    const { editor } = this;
                    const downcastWriter = conversionApi.writer;
                    const modelElement = data.item;
                    const viewElement = conversionApi.mapper.toViewElement(modelElement);
                    const preview = downcastWriter.createUIElement('span', { class: 'ibexa-embed-content' }, function (domDocument) {
                        const contentId = modelElement.getAttribute('contentId');
                        const contentName = modelElement.getAttribute('contentName');
                        const locationId = modelElement.getAttribute('locationId');
                        const languageCodes = modelElement.getAttribute('languageCodes');
                        const domElement = this.toDomElement(domDocument);
                        const itemActionsContainer = editor.sourceElement.parentNode.querySelector('.ibexa-embedded-item-actions');

                        domElement.innerHTML = renderPreview(contentName, contentId, itemActionsContainer);

                        const itemActionsTriggerElement = domElement.querySelector('.ibexa-embedded-item__actions-menu-trigger-btn');
                        const itemActionsMenuContainer = domElement.querySelector(
                            '.ibexa-embedded-item-actions .ibexa-multilevel-popup-menu',
                        );

                        domDocument.body.dispatchEvent(
                            new CustomEvent('ibexa-embedded-item:create-dynamic-menu', {
                                detail: {
                                    contentId,
                                    locationId,
                                    languageCodes,
                                    menuTriggerElement: itemActionsTriggerElement,
                                    menuContainer: itemActionsMenuContainer,
                                },
                            }),
                        );

                        return domElement;
                    });

                    downcastWriter.remove(downcastWriter.createRangeIn(viewElement));
                    downcastWriter.insert(downcastWriter.createPositionAt(viewElement, 0), preview);
                }),
            );

        conversion.for('dataDowncast').elementToElement({
            model: 'embedInline',
            view: (modelElement, { writer: downcastWriter }) => {
                const container = downcastWriter.createContainerElement('span', {
                    'data-href': `ezcontent://${modelElement.getAttribute('contentId')}`,
                    'data-ezelement': 'ezembedinline',
                    'data-ezview': 'embed-inline',
                });

                return container;
            },
        });

        conversion.for('upcast').elementToElement({
            view: {
                name: 'span',
                attributes: {
                    'data-ezelement': 'ezembedinline',
                },
            },
            model: (viewElement, { writer: upcastWriter }) => {
                if (viewElement.hasClass('ibexa-embed-type-image')) {
                    return;
                }

                const href = viewElement.getAttribute('data-href');
                const contentId = href.replace('ezcontent://', '');
                const modelElement = upcastWriter.createElement('embedInline', { contentId });
                const token = document.querySelector('meta[name="CSRF-Token"]').content;
                const siteaccess = document.querySelector('meta[name="SiteAccess"]').content;

                findContent({ token, siteaccess, contentId }, (contents) => {
                    const contentName = contents[0].TranslatedName;
                    const locationId = contents[0].MainLocation._href.split('/').pop();
                    const languageCodes = contents[0].CurrentVersion.Version.VersionInfo.VersionTranslationInfo.Language.map(
                        (language) => language.languageCode,
                    );

                    this.editor.model.change((writer) => {
                        writer.setAttribute('contentName', contentName, modelElement);
                        writer.setAttribute('contentId', contentId, modelElement);
                        writer.setAttribute('locationId', locationId, modelElement);
                        writer.setAttribute('languageCodes', languageCodes, modelElement);
                    });
                });

                return modelElement;
            },
        });
    }

    init() {
        this.defineSchema();
        this.defineConverters();

        this.editor.commands.add('insertIbexaEmbedInline', new IbexaEmbedContentInlineCommand(this.editor));
    }
}

export default IbexaEmbedContentInlineEditing;
