<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\REST\Output\ValueObjectVisitor;

use Ibexa\Contracts\Rest\Output\Generator;
use Ibexa\Contracts\Rest\Output\ValueObjectVisitor;
use Ibexa\Contracts\Rest\Output\Visitor;

final class RichTextConfigVisitor extends ValueObjectVisitor
{
    public function visit(Visitor $visitor, Generator $generator, $data): void
    {
        $generator->startObjectElement('RichTextConfig');
        $visitor->setHeader('Content-Type', $generator->getMediaType('RichTextConfig'));

        foreach ($data->getConfig() as $namespace => $config) {
            $generator->generateFieldTypeHash($namespace, $config);
        }

        $generator->endObjectElement('RichTextConfig');
    }
}
