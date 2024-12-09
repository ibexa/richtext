<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\Tests\FieldTypeRichText\RichText\TextExtractor\NodeFilter;

use DOMDocument;
use DOMNode;
use DOMNodeList;
use DOMXPath;
use Ibexa\FieldTypeRichText\RichText\TextExtractor\NodeFilter\NodePathFilter;
use PHPUnit\Framework\TestCase;

final class NodePathFilterTest extends TestCase
{
    public function testFilter(): void
    {
        $document = new DOMDocument();
        $document->loadXML('<a><b><c></c></b></a>');

        $nodeA = $this->getNode($document, '//a');
        $nodeB = $this->getNode($document, '//b');
        $nodeC = $this->getNode($document, '//c');

        self::assertFalse((new NodePathFilter('b', 'c'))->filter($nodeB));
        self::assertTrue((new NodePathFilter('b', 'c'))->filter($nodeC));
        self::assertFalse((new NodePathFilter('a', 'b', 'c', 'd'))->filter($nodeA));
    }

    private function getNode(DOMDocument $document, string $expression): DOMNode
    {
        $xpath = new DOMXPath($document);

        $results = $xpath->query($expression);
        if ($results instanceof DOMNodeList) {
            /** @var \DOMNode */
            return $results->item(0);
        }

        self::fail("Expression '$expression' did not return a node.");
    }
}
