<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\Configuration\Provider;

use Ibexa\Bundle\FieldTypeRichText\DependencyInjection\Configuration\Parser\FieldType\RichText;
use Ibexa\Contracts\FieldTypeRichText\Configuration\Provider;
use Ibexa\Core\MVC\ConfigResolverInterface;

/**
 * CKEditor configuration provider.
 *
 * @internal For internal use by RichText package
 */
final class CKEditor implements Provider
{
    private const SEPARATOR = '|';
    private const CUSTOM_STYLE_INLINE = 'ibexaCustomStyleInline';

    /** @var \Ibexa\Core\MVC\ConfigResolverInterface */
    private $configResolver;

    /** @var array */
    private $customStylesConfiguration;

    public function __construct(
        ConfigResolverInterface $configResolver,
        array $customStylesConfiguration
    ) {
        $this->configResolver = $configResolver;
        $this->customStylesConfiguration = $customStylesConfiguration;
    }

    public function getName(): string
    {
        return 'CKEditor';
    }

    /**
     * Returns CKEditor configuration.
     *
     * @phpstan-return array<array-key, array{
     *  toolbar: array<string>,
     * }>
     */
    public function getConfiguration(): array
    {
        return [
            'toolbar' => array_values($this->getToolbar()),
        ];
    }

    /**
     * Returns toolbar buttons.
     *
     * @phpstan-return array<string>
     */
    private function getToolbar(): array
    {
        $filteredButtons = $this->filterButtonsByGroups(
            $this->getSiteAccessConfigArray(RichText::TOOLBARS_SA_SETTINGS_ID)
        );

        if (in_array(self::CUSTOM_STYLE_INLINE, $filteredButtons) && !$this->hasInlineCustomStyles()) {
            return $this->removeInlineCustomStyleButton($filteredButtons);
        }

        return $filteredButtons;
    }

    /**
     * Returns filtered Toolbar buttons configuration.
     *
     * @phpstan-return array<string>
     */
    private function filterButtonsByGroups(
        array $groupsConfiguration = []
    ): array {
        $buttons = [];

        $groupsConfiguration = array_filter(
            $groupsConfiguration,
            static function (array $group): bool {
                return $group['visible'];
            }
        );

        uasort($groupsConfiguration, static function (array $a, array $b): int {
            return $b['priority'] <=> $a['priority'];
        });

        foreach ($groupsConfiguration as $configuration) {
            $filteredButtons = $this->filterButtons($configuration['buttons'] ?? []);

            if (count($filteredButtons) === 0) {
                continue;
            }

            $buttons = array_merge($buttons, $filteredButtons, [self::SEPARATOR]);
        }

        // Removes last separator from the buttons list.
        array_pop($buttons);

        return $buttons;
    }

    /**
     * Returns List of visible, sorted buttons.
     *
     * @phpstan-return array<string>
     */
    private function filterButtons(array $buttons): array
    {
        $buttons = array_filter($buttons, static function (array $button): bool {
            return $button['visible'];
        });

        uasort($buttons, static function (array $a, array $b): int {
            return $b['priority'] <=> $a['priority'];
        });

        return array_keys($buttons);
    }

    private function hasInlineCustomStyles(): bool
    {
        $enabledCustomStyles = $this->getSiteAccessConfigArray('fieldtypes.ezrichtext.custom_styles');

        return 0 !== count(array_filter(
            $this->customStylesConfiguration,
            static function (array $customStyle, string $name) use ($enabledCustomStyles): bool {
                return in_array($name, $enabledCustomStyles, true) && $customStyle['inline'];
            },
            ARRAY_FILTER_USE_BOTH
        ));
    }

    /**
     * @phpstan-return array<string>
     */
    private function removeInlineCustomStyleButton(array $filteredButtons): array
    {
        return array_filter(
            $filteredButtons,
            static function (string $buttonValue): bool {
                return $buttonValue !== self::CUSTOM_STYLE_INLINE;
            },
        );
    }

    /**
     * Get configuration array from the SiteAccess-aware configuration, checking first for its existence.
     */
    private function getSiteAccessConfigArray(string $paramName): array
    {
        return $this->configResolver->hasParameter($paramName)
            ? $this->configResolver->getParameter($paramName)
            : [];
    }
}

class_alias(CKEditor::class, 'EzSystems\EzPlatformRichText\Configuration\Provider\CKEditor');
