<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\RichText\TextExtractor;

use DOMDocument;
use DOMNode;
use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface;
use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractorInterface;

/**
 * Extracts text content of the given $document.
 *
 * @internal Only for use by RichText FieldType itself.
 */
final class FullTextExtractor implements TextExtractorInterface
{
    private NodeFilterInterface $filter;

    public function __construct(NodeFilterInterface $filter)
    {
        $this->filter = $filter;
    }

    public function extractText(DOMDocument $document): string
    {
        return null !== $document->documentElement
            ? $this->extractTextFromNode($document->documentElement)
            : '';
    }

    private function extractTextFromNode(DOMNode $node): string
    {
        if ($this->filter->filter($node) === true) {
            // Node is excluded
            return '';
        }

        $text = '';
        if ($node->childNodes !== null && $node->childNodes->count() > 0) {
            foreach ($node->childNodes as $child) {
                $text .= $this->extractTextFromNode($child);
            }
        } elseif (!empty($node->nodeValue)) {
            $text .= $node->nodeValue . ' ';
        }

        return $text;
    }
}
