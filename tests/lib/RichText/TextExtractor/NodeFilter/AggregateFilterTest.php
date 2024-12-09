<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\Tests\FieldTypeRichText\RichText\TextExtractor\NodeFilter;

use DOMNode;
use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface;
use Ibexa\FieldTypeRichText\RichText\TextExtractor\NodeFilter\AggregateFilter;
use PHPUnit\Framework\TestCase;

final class AggregateFilterTest extends TestCase
{
    public function testFilter(): void
    {
        $node = $this->createMock(DOMNode::class);

        $filterA = $this->createMock(NodeFilterInterface::class);
        $filterA->expects(self::once())->method('filter')->with($node)->willReturn(false);
        $filterB = $this->createMock(NodeFilterInterface::class);
        $filterB->expects(self::once())->method('filter')->with($node)->willReturn(true);
        $filterC = $this->createMock(NodeFilterInterface::class);
        $filterC->expects(self::never())->method('filter');

        $aggregateFilter = new AggregateFilter([$filterA, $filterB, $filterC]);

        self::assertTrue($aggregateFilter->filter($node));
    }
}
