<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\Form\DataTransformer;

use eZ\Publish\API\Repository\Exceptions\InvalidArgumentException;
use eZ\Publish\API\Repository\Exceptions\NotFoundException;
use Ibexa\Contracts\FieldTypeRichText\RichText\Converter;
use Ibexa\Contracts\FieldTypeRichText\RichText\InputHandlerInterface;
use Ibexa\FieldTypeRichText\FieldType\RichText\Value;
use Ibexa\FieldTypeRichText\RichText\DOMDocumentFactory;
use Symfony\Component\Form\DataTransformerInterface;
use Symfony\Component\Form\Exception\TransformationFailedException;

class RichTextTransformer implements DataTransformerInterface
{
    /**
     * @var \EzSystems\EzPlatformRichText\eZ\RichText\DOMDocumentFactory
     */
    private $domDocumentFactory;

    /**
     * @var \EzSystems\EzPlatformRichText\eZ\RichText\InputHandlerInterface
     */
    private $inputHandler;

    /**
     * @var \EzSystems\EzPlatformRichText\eZ\RichText\Converter
     */
    private $docbook2xhtml5editConverter;

    /**
     * @param \EzSystems\EzPlatformRichText\eZ\RichText\DOMDocumentFactory $domDocumentFactory
     * @param \EzSystems\EzPlatformRichText\eZ\RichText\InputHandlerInterface $inputHandler
     * @param \EzSystems\EzPlatformRichText\eZ\RichText\Converter $docbook2xhtml5editConverter
     */
    public function __construct(
        DOMDocumentFactory $domDocumentFactory,
        InputHandlerInterface $inputHandler,
        Converter $docbook2xhtml5editConverter
    ) {
        $this->domDocumentFactory = $domDocumentFactory;
        $this->inputHandler = $inputHandler;
        $this->docbook2xhtml5editConverter = $docbook2xhtml5editConverter;
    }

    /**
     * @inheritdoc
     */
    public function transform($value): string
    {
        if (!$value) {
            $value = Value::EMPTY_VALUE;
        }

        try {
            return $this->docbook2xhtml5editConverter->convert(
                $this->domDocumentFactory->loadXMLString((string) $value)
            )->saveXML();
        } catch (NotFoundException | InvalidArgumentException $e) {
            throw new TransformationFailedException($e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * @inheritdoc
     */
    public function reverseTransform($value): string
    {
        try {
            return $this->inputHandler->fromString($value)->saveXML();
        } catch (NotFoundException | InvalidArgumentException $e) {
            throw new TransformationFailedException($e->getMessage(), $e->getCode(), $e);
        }
    }
}

class_alias(RichTextTransformer::class, 'EzSystems\EzPlatformRichText\Form\DataTransformer\RichTextTransformer');
