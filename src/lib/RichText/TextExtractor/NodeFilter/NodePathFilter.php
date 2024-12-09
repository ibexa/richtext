<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\RichText\TextExtractor\NodeFilter;

use DOMNode;
use Ibexa\Contracts\FieldTypeRichText\RichText\TextExtractor\NodeFilterInterface;

final class NodePathFilter implements NodeFilterInterface
{
    /**
     * Path in reverse order.
     *
     * @var string[]
     */
    private array $path;

    public function __construct(string ...$path)
    {
        $this->path = array_reverse($path);
    }

    public function filter(DOMNode $node): bool
    {
        foreach ($this->path as $name) {
            if ($node === null || $node->nodeName !== $name) {
                return false;
            }

            $node = $node->parentNode;
        }

        return true;
    }
}
