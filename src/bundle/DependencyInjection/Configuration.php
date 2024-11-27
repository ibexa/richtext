<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\Bundle\FieldTypeRichText\DependencyInjection;

use Ibexa\Bundle\Core\DependencyInjection\Configuration\SiteAccessAware\Configuration as SiteAccessConfiguration;
use Symfony\Component\Config\Definition\Builder\NodeBuilder;
use Symfony\Component\Config\Definition\Builder\NodeDefinition;
use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;

class Configuration extends SiteAccessConfiguration
{
    public const CUSTOM_TAG_ATTRIBUTE_TYPES = ['number', 'string', 'boolean', 'choice', 'link'];

    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder(IbexaFieldTypeRichTextExtension::EXTENSION_NAME);

        $rootNode = $treeBuilder->getRootNode();

        $sections = $rootNode->children();

        $rootNode
            ->children()
                ->booleanNode('expose_config_as_global')
                    ->defaultTrue()
                    ->setDeprecated(
                        'ibexa/fieldtype-richtext',
                        '4.6',
                        'expose_config_as_global configuration is deprecated and will be removed in 5.0. '
                        . 'Acquire RichText configuration via REST API instead.'
                    )
                ->end()
            ->end();

        $this
            ->addEnabledAttributeTypesSection($sections);
        $this
            ->addCustomTagsSection($sections);
        $this
            ->addCustomStylesSection($sections);
        $this
            ->addAlloyEditorSection($sections);

        $this
            ->validateAttributeTypes($rootNode)
            ->end();

        return $treeBuilder;
    }

    private function addEnabledAttributeTypesSection(NodeBuilder $richTextNode): NodeBuilder
    {
        return $richTextNode
                ->arrayNode('enabled_attribute_types')
                    ->defaultValue(self::CUSTOM_TAG_ATTRIBUTE_TYPES)
                    ->scalarPrototype()
                    ->end()
                ->end()
        ;
    }

    private function validateAttributeTypes(NodeDefinition $rootNode): NodeDefinition
    {
        return $rootNode
            ->validate()
            ->ifTrue(static function (array $v): bool {
                if (!isset($v['enabled_attribute_types']) || !isset($v['custom_tags'])) {
                    return false;
                }
                $enabledTypes = $v['enabled_attribute_types'];
                foreach ($v['custom_tags'] as $tagIdentifier => $tag) {
                    foreach ($tag['attributes'] as $attribute) {
                        if (!in_array($attribute['type'], $enabledTypes, true)) {
                            throw new InvalidConfigurationException(
                                sprintf(
                                    'The value "%s" is not allowed for path "ibexa_fieldtype_richtext.custom_tags.%s.attributes.campaign.type". Allowed values: %s',
                                    $attribute['type'],
                                    $tagIdentifier,
                                    implode(', ', array_map(static fn ($type): string => "\"$type\"", $enabledTypes))
                                )
                            );
                        }
                    }
                }

                return false;
            })
            ->then(static fn (array $v): array => $v)
            ->end();
    }

    /**
     * Define RichText Custom Tags Semantic Configuration.
     *
     * The configuration is available at:
     * <code>
     * ezrichtext:
     *     custom_tags:
     * </code>
     *
     * @param \Symfony\Component\Config\Definition\Builder\NodeBuilder $ezRichTextNode
     *
     * @return \Symfony\Component\Config\Definition\Builder\ArrayNodeDefinition
     */
    private function addCustomTagsSection(NodeBuilder $ezRichTextNode)
    {
        return $ezRichTextNode
                ->arrayNode('custom_tags')
                ->normalizeKeys(false)
                // workaround: take into account Custom Tag names when merging configs
                ->useAttributeAsKey('tag')
                ->arrayPrototype()
                    ->children()
                        ->scalarNode('template')
                            ->isRequired()
                        ->end()
                        ->scalarNode('icon')
                            ->defaultNull()
                        ->end()
                        ->scalarNode('is_inline')
                            ->defaultFalse()
                        ->end()
                        ->arrayNode('attributes')
                            ->useAttributeAsKey('attribute')
                            ->arrayPrototype()
                                ->beforeNormalization()
                                    ->always(
                                        static function ($v) {
                                            // Workaround: set empty value to be able to unset it later on (see validation for "choices")
                                            if (!isset($v['choices'])) {
                                                $v['choices'] = [];
                                            }

                                            return $v;
                                        }
                                    )
                                ->end()
                                ->validate()
                                    ->ifTrue(
                                        static function ($v) {
                                            return $v['type'] === 'choice' && !empty($v['required']) && empty($v['choices']);
                                        }
                                    )
                                    ->thenInvalid('List of choices for required choice type attribute has to be non-empty')
                                ->end()
                                ->validate()
                                    ->ifTrue(
                                        static function ($v) {
                                            return !empty($v['choices']) && $v['type'] !== 'choice';
                                        }
                                    )
                                    ->thenInvalid('List of choices is supported by choices type only.')
                                ->end()
                                ->children()
                                    ->scalarNode('type')
                                        ->isRequired()
                                    ->end()
                                    ->booleanNode('required')
                                        ->defaultFalse()
                                    ->end()
                                    ->scalarNode('default_value')
                                        ->defaultNull()
                                    ->end()
                                    ->arrayNode('choices')
                                        ->scalarPrototype()->end()
                                        ->performNoDeepMerging()
                                        ->validate()
                                            ->ifEmpty()->thenUnset()
                                        ->end()
                                    ->end()
                                ->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
        ;
    }

    /**
     * Define RichText Custom Styles Semantic Configuration.
     *
     * The configuration is available at:
     * <code>
     * ezpublish:
     *     ezrichtext:
     *         custom_styles:
     * </code>
     *
     * @param \Symfony\Component\Config\Definition\Builder\NodeBuilder $ezRichTextNode
     *
     * @return \Symfony\Component\Config\Definition\Builder\ArrayNodeDefinition
     */
    private function addCustomStylesSection(NodeBuilder $ezRichTextNode)
    {
        return $ezRichTextNode
                ->arrayNode('custom_styles')
                // workaround: take into account Custom Styles names when merging configs
                    ->useAttributeAsKey('style')
                    ->arrayPrototype()
                        ->children()
                            ->scalarNode('template')
                                ->defaultNull()
                            ->end()
                            ->scalarNode('inline')
                                ->defaultFalse()
                            ->end()
                        ->end()
                    ->end()
                ->end()
        ;
    }

    /**
     * Define RichText AlloyEditor Semantic Configuration.
     *
     * The configuration is available at:
     * <code>
     * ezpublish:
     *     ezrichtext:
     *         alloy_editor:
     *             extra_plugins: [plugin1, plugin2]
     *             extra_buttons:
     *                 paragraph: [button1, button2]
     *                 embed: [button1]
     *             native_attributes:
     *                 table: [border]
     * </code>
     *
     * Please note extra_buttons setting will be deprecated in eZ Platform 3.x.
     * The alternative and more flexible solution will be introduced.
     * So you will need to update Online Editor Extra Buttons as part of eZ Platform 3.x upgrade.
     *
     * @param \Symfony\Component\Config\Definition\Builder\NodeBuilder $ezRichTextNode
     *
     * @return \Symfony\Component\Config\Definition\Builder\ArrayNodeDefinition
     */
    private function addAlloyEditorSection(NodeBuilder $ezRichTextNode)
    {
        return $ezRichTextNode
                ->arrayNode('alloy_editor')
                    ->children()
                        ->arrayNode('extra_plugins')
                            ->example(['plugin1', 'plugin2'])
                            ->prototype('scalar')->end()
                        ->end()
                        ->arrayNode('extra_buttons')
                            ->useAttributeAsKey('name')
                            ->arrayPrototype()
                                ->example(['button1', 'button2'])
                                ->prototype('scalar')->end()
                            ->end()
                        ->end()
                        ->arrayNode('native_attributes')
                            ->useAttributeAsKey('name')
                            ->arrayPrototype()
                                ->example(['border', 'width'])
                                ->prototype('scalar')->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
        ;
    }
}

class_alias(Configuration::class, 'EzSystems\EzPlatformRichTextBundle\DependencyInjection\Configuration');
