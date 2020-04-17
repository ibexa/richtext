import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AlloyEditor from 'alloyeditor';
import EzEmbedImageButton from './base/ez-embedimage';

export default class EzBtnImage extends EzEmbedImageButton {
    static get key() {
        return 'ezimage';
    }

    /**
     * Checks if the command is disabled in the current selection.
     *
     * @method isDisabled
     * @return {Boolean} True if the command is disabled, false otherwise.
     */
    isDisabled() {
        return !this.props.editor.get('nativeEditor').ezembed.canBeAdded();
    }

    /**
     * Executes the command generated by the ezembed plugin and set the
     * correct value based on the choosen image.
     *
     * @method addImage
     * @param {Array} items the result of the choice in the UDW
     */
    addImage(items) {
        const content = items[0].ContentInfo.Content;

        if (navigator.userAgent.indexOf('Chrome') > -1) {
            const scrollY = window.pageYOffset;

            this.execCommand();
            window.scroll(window.pageXOffset, scrollY);
        } else {
            this.execCommand();
        }

        this.setContentInfo(content._id);

        const widget = this.getWidget()
            .setConfig('size', 'medium')
            .setImageType()
            .setWidgetContent('');
        widget.loadImagePreviewFromCurrentVersion(content.CurrentVersion._href, content.Name);
        widget.setFocused(true);

        ReactDOM.unmountComponentAtNode(document.querySelector('#react-udw'));
    }

    /**
     * Lifecycle. Renders the UI of the button.
     *
     * @method render
     * @return {Object} The content which should be rendered.
     */
    render() {
        const css = 'ae-button ez-btn-ae ez-btn-ae--image ' + this.getStateClasses(),
            disabled = this.isDisabled();
        const label = Translator.trans(/*@Desc("Image")*/ 'image_btn.label', {}, 'alloy_editor');

        return (
            <button
                className={css}
                disabled={disabled}
                onClick={this.chooseContent.bind(this)}
                tabIndex={this.props.tabIndex}
                title={label}>
                <svg className="ez-icon ez-btn-ae__icon">
                    <use xlinkHref="/bundles/ezplatformadminui/img/ez-icons.svg#image" />
                </svg>
            </button>
        );
    }
}

AlloyEditor.Buttons[EzBtnImage.key] = AlloyEditor.EzBtnImage = EzBtnImage;

const eZ = (window.eZ = window.eZ || {});

eZ.ezAlloyEditor = eZ.ezAlloyEditor || {};
eZ.ezAlloyEditor.ezBtnImage = EzBtnImage;

EzBtnImage.defaultProps = {
    command: 'ezembed',
    modifiesSelection: true,
    udwTitle: Translator.trans(/*@Desc("Select an image")*/ 'image_btn.udw.label', {}, 'alloy_editor'),
    udwContentDiscoveredMethod: 'addImage',
    udwConfigName: 'richtext_embed_image',
    udwLoadContent: true,
};
