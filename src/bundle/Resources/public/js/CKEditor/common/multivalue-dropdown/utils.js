import View from '@ckeditor/ckeditor5-ui/src/view';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';

import ChipsButtonView from '../../common/chips-button-view/chips-button-view';

export const addMultivalueSupport = (labeledDropdown, config, listenerView) => {
    labeledDropdown.fieldView.panelView.extendTemplate({
        attributes: {
            class: 'ck-dropdown__panel--multiple',
        },
    });

    labeledDropdown.fieldView.buttonView.labelView = labeledDropdown.fieldView.buttonView._setupLabelView(new ChipsButtonView());

    labeledDropdown.fieldView.panelView.children.on('add', (event, panelViewItem) => {
        if (!(panelViewItem instanceof ListView)) {
            return;
        }

        const selectedItems = new Set(labeledDropdown.fieldView.element.value?.split(' '));

        panelViewItem.items.forEach((item, key) => {
            const itemValue = config.choices[key];
            const isSelected = selectedItems.has(itemValue);
            const inputView = new View();

            inputView.setTemplate({
                tag: 'input',
                attributes: {
                    class: 'ibexa-ckeditor-input--checkbox',
                    type: 'checkbox',
                    checked: isSelected,
                },
            });
            item.children.get(0).children.add(inputView, 0);
        });
    });

    listenerView.on('ibexa-ckeditor:custom-attributes:recalculate-chips', () => {
        labeledDropdown.fieldView.buttonView.labelView.rerenderChips();
    });
};
