<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\RichText\TextExtractor\NodeFilter;

use DOMNode;
use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface;

final class AggregateFilter implements NodeFilterInterface
{
    /** @var \Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface[] */
    private iterable $filters;

    /**
     * @param \Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface[]|iterable $filters
     */
    public function __construct(iterable $filters)
    {
        $this->filters = $filters;
    }

    public function filter(DOMNode $node): bool
    {
        foreach ($this->filters as $filter) {
            if ($filter->filter($node)) {
                return true;
            }
        }

        return false;
    }
}
