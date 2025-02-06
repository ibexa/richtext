import View from '@ckeditor/ckeditor5-ui/src/view';

export default class IbexaChipsButtonView extends View {
    constructor() {
        super();
        this.set({
            style: undefined,
            text: undefined,
            id: undefined,
        });
        const bind = this.bindTemplate;
        this.children = this.createCollection();
        this.setTemplate({
            tag: 'ul',
            attributes: {
                class: ['ibexa-ckeditor-dropdown-selected-items'],
                style: bind.to('style'),
                id: bind.to('id'),
            },
            children: this.children,
        });

        this.listenTo(this, 'change:text', (event, item, value) => {
            this.fitChips(event.source.element, value);
        });
    }

    rerenderChips() {
        this.fitChips(this.element, this.text ?? '');
    }

    fitChips(container, value) {
        const selectedItems = value.split(' ').filter((selectedItem) => selectedItem !== '');
        let showOverflow = false;
        let currentIndex = 0;

        this.children.clear();

        while (!showOverflow && currentIndex < selectedItems.length) {
            const selectedItem = selectedItems[currentIndex];
            const chip = this.createChip(selectedItem);

            this.children.add(chip);

            showOverflow = container.scrollWidth > container.offsetWidth;
            currentIndex++;

            if (showOverflow) {
                this.children.remove(this.children.last);
            }
        }

        if (showOverflow) {
            const overflownItems = selectedItems.length - currentIndex + 1;
            let overflowChip = this.createChip(`+${overflownItems}`);

            this.children.add(overflowChip);

            if (container.scrollWidth > container.offsetWidth) {
                this.children.remove(this.children.last);
                this.children.remove(this.children.last);

                overflowChip = this.createChip(`+${overflownItems + 1}`);

                this.children.add(overflowChip);
            }
        }
    }

    createChip(text) {
        const chip = new View();

        chip.setTemplate({
            tag: 'li',
            attributes: {
                class: ['ibexa-ckeditor-dropdown-selected-items__item'],
            },
            children: [
                {
                    text,
                },
            ],
        });

        return chip;
    }
}
