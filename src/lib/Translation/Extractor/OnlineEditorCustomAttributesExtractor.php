<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\Translation\Extractor;

use Ibexa\Bundle\FieldTypeRichText\DependencyInjection\Configuration\Parser\FieldType\RichText;
use Ibexa\Contracts\Core\SiteAccess\ConfigResolverInterface;
use JMS\TranslationBundle\Model\Message\XliffMessage;
use JMS\TranslationBundle\Model\MessageCatalogue;
use JMS\TranslationBundle\Translation\ExtractorInterface;

final class OnlineEditorCustomAttributesExtractor implements ExtractorInterface
{
    private const MESSAGE_DOMAIN = 'online_editor';
    private const ATTRIBUTES_MESSAGE_ID_PREFIX = 'ezrichtext.attributes';
    private const CLASS_LABEL_MESSAGE_ID = 'ezrichtext.classes.class.label';

    /**
     * @var \Ibexa\Contracts\Core\SiteAccess\ConfigResolverInterface
     */
    private $configResolver;

    /**
     * @var string[]
     */
    private $siteAccessList;

    /**
     * @param \Ibexa\Contracts\Core\SiteAccess\ConfigResolverInterface $configResolver
     * @param string[] $siteAccessList
     */
    public function __construct(ConfigResolverInterface $configResolver, array $siteAccessList)
    {
        $this->configResolver = $configResolver;
        $this->siteAccessList = $siteAccessList;
    }

    /**
     * Iterate over each scope and extract custom attributes label names.
     *
     * @return \JMS\TranslationBundle\Model\MessageCatalogue
     */
    public function extract(): MessageCatalogue
    {
        $catalogue = new MessageCatalogue();

        $catalogue->add($this->createMessage(self::CLASS_LABEL_MESSAGE_ID, 'Class'));

        foreach ($this->siteAccessList as $scope) {
            if (!$this->configResolver->hasParameter(RichText::ATTRIBUTES_SA_SETTINGS_ID, null, $scope)) {
                continue;
            }
            $this->extractMessagesForScope($catalogue, $scope);
        }

        return $catalogue;
    }

    /**
     * @param string $id
     * @param string $desc
     *
     * @return \JMS\TranslationBundle\Model\Message\XliffMessage
     */
    private function createMessage(string $id, string $desc): XliffMessage
    {
        $message = new XliffMessage($id, self::MESSAGE_DOMAIN);
        $message->setNew(false);
        $message->setMeaning($desc);
        $message->setDesc($desc);
        $message->setLocaleString($desc);
        $message->addNote('key: ' . $id);

        return $message;
    }

    /**
     * Extract messages from the given scope into the catalogue.
     *
     * @param \JMS\TranslationBundle\Model\MessageCatalogue $catalogue
     * @param string $scope
     */
    private function extractMessagesForScope(MessageCatalogue $catalogue, string $scope): void
    {
        $attributes = $this->configResolver->getParameter(
            RichText::ATTRIBUTES_SA_SETTINGS_ID,
            null,
            $scope
        );
        foreach ($attributes as $elementName => $attributesConfig) {
            foreach (array_keys($attributesConfig) as $attributeName) {
                $messageId = sprintf(
                    '%s.%s.%s.label',
                    self::ATTRIBUTES_MESSAGE_ID_PREFIX,
                    $elementName,
                    $attributeName
                );
                // by default let's use attribute name
                $catalogue->add(
                    $this->createMessage($messageId, $attributeName)
                );
            }
        }
    }
}

class_alias(OnlineEditorCustomAttributesExtractor::class, 'EzSystems\EzPlatformRichText\Translation\Extractor\OnlineEditorCustomAttributesExtractor');
